const { ApolloServer, gql } = require('apollo-server');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

mongoose.connect('mongodb://localhost:27017/mediconnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.once('open', () => console.log('✅ MongoDB connecté'));


const JWT_SECRET = 'JhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkw';

//--- Modèles ---
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: String,
  role: String,
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const doctorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  specialty: String,
  city: String,
});
const Doctor = mongoose.model('Doctor', doctorSchema);

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: String,
  time: String,
  status: { type: String, default: 'CONFIRMED' }
});
const Appointment = mongoose.model('Appointment', appointmentSchema);

const timeSlotSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: String,
  time: String,
  available: { type: Boolean, default: true }
});
const TimeSlot = mongoose.model('TimeSlot', timeSlotSchema);

// --- GraphQL Schema ---
const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
    createdAt: String!
  }

  type Doctor {
    id: ID!
    userId: ID!
    name: String!
    specialty: String!
    city: String!
  }

  type Appointment {
    id: ID!
    patientId: ID!
    doctorId: ID!
    date: String!
    time: String!
    status: String!
  }

  type TimeSlot {
    id: ID!
    doctorId: ID!
    date: String!
    time: String!
    available: Boolean!
  }

  type AuthPayload {
    user: User!
    token: String!
  }

  input RegisterInput {
    name: String!
    email: String!
    password: String!
    role: String!
  }

  type Query {
    getDoctorsBySpecialty(specialty: String, city: String): [Doctor]
    getUserAppointments(userId: ID!): [Appointment]
    getAvailableSlots(doctorId: ID!, date: String!): [TimeSlot]
  }

  type Mutation {
    registerUser(input: RegisterInput): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    bookAppointment(patientId: ID!, doctorId: ID!, date: String!, time: String!): Appointment!
    cancelAppointment(appointmentId: ID!): Boolean!
    createTimeSlot(doctorId: ID!, date: String!, time: String!): TimeSlot!
  }
`;

// --- Resolvers ---
const resolvers = {
  Query: {
    getDoctorsBySpecialty: async (_, { specialty, city }) => {
      const query = {};
      if (specialty) query.specialty = specialty;
      if (city) query.city = city;
      return await Doctor.find(query);
    },
    getUserAppointments: async (_, { userId }) => {
      return await Appointment.find({
        $or: [{ patientId: userId }, { doctorId: userId }],
      });
    },
    getAvailableSlots: async (_, { doctorId, date }) => {
      return await TimeSlot.find({ doctorId, date, available: true });
    },
  },
  Mutation: {
    registerUser: async (_, { input }) => {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: input.email });
        if (existingUser) {
          throw new Error('Un utilisateur avec cet email existe déjà');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(input.password, 12);

        // Create user
        const newUser = await User.create({
          ...input,
          password: hashedPassword
        });

        // If doctor, create doctor profile
        if (input.role === 'DOCTOR') {
          await Doctor.create({
            userId: newUser._id,
            name: input.name,
            specialty: 'Généraliste',
            city: 'Tunis',
          });
        }

        // Generate JWT token
        const token = jwt.sign(
          { userId: newUser._id, email: newUser.email, role: newUser.role },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        // Return user without password
        const userResponse = {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          createdAt: newUser.createdAt.toISOString()
        };

        return { user: userResponse, token };
      } catch (error) {
        throw new Error(`Erreur lors de l'inscription: ${error.message}`);
      }
    },
    login: async (_, { email, password }) => {
      try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
          throw new Error('Email ou mot de passe incorrect');
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          throw new Error('Email ou mot de passe incorrect');
        }

        // Generate JWT token
        const token = jwt.sign(
          { userId: user._id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        // Return user without password
        const userResponse = {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt.toISOString()
        };

        return { user: userResponse, token };
      } catch (error) {
        throw new Error(`Erreur lors de la connexion: ${error.message}`);
      }
    },
    bookAppointment: async (_, { patientId, doctorId, date, time }) => {
      const slot = await TimeSlot.findOne({ doctorId, date, time, available: true });
      if (!slot) throw new Error("Créneau indisponible");
      slot.available = false;
      await slot.save();

      return await Appointment.create({ patientId, doctorId, date, time });
    },
    cancelAppointment: async (_, { appointmentId }) => {
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) return false;

      await TimeSlot.findOneAndUpdate(
        { doctorId: appointment.doctorId, date: appointment.date, time: appointment.time },
        { available: true }
      );

      await appointment.deleteOne();
      return true;
    },
    createTimeSlot: async (_, { doctorId, date, time }) => {
      // Check if slot already exists
      const existingSlot = await TimeSlot.findOne({ doctorId, date, time });
      if (existingSlot) {
        throw new Error('Ce créneau existe déjà');
      }
      // Create new slot
      const newSlot = await TimeSlot.create({ doctorId, date, time, available: true });
      return newSlot;
    },
  },
};

// --- Serveur Apollo ---
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    // Get token from headers
    const token = req.headers.authorization || '';
    
    if (token) {
      try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
        return { user: decoded };
      } catch (error) {

        return { user: null };
      }
    }
    
    return { user: null };
  },
});

server.listen().then(({ url }) => {
  console.log(`🚀 Serveur HealthBook prêt à : ${url}`);
});
