// Tüm auth state artık AuthContext üzerinden paylaşılıyor.
// Her component aynı singleton state'i görür.
export { useAuth } from '../contexts/AuthContext';
