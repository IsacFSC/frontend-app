
'use client';

import { useState, useEffect } from 'react';
import { User } from '../services/userService';

enum Role {
  ADMIN = 'ADMIN',
  LEADER = 'LEADER',
  USER = 'USER',
}

interface UserFormProps {
  userToEdit?: User | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  successMessage?: string;
}

export default function UserForm({ userToEdit, onSubmit, onCancel, successMessage }: UserFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.USER);

  const isEditing = !!userToEdit;

  useEffect(() => {
    if (isEditing) {
      setName(userToEdit.name);
      setEmail(userToEdit.email);
      setRole(userToEdit.role);
      // Password field is kept blank for security
      setPassword('');
    }
  }, [userToEdit, isEditing]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const formData: any = { name, email, role };
    // Only include the password if it was entered
    if (password) {
      formData.password = password;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {successMessage && (
  <div className="bg-gray-950 border border-gray-950 text-gray-200 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
      <div className="mb-4">
        <label htmlFor="name" className="block text-gray-200 text-sm font-bold mb-2">Name</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-950 text-gray-200 leading-tight focus:outline-none focus:shadow-outline"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="email" className="block text-gray-200 text-sm font-bold mb-2">Email</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-950 text-gray-200 leading-tight focus:outline-none focus:shadow-outline"
          required
          disabled={isEditing} // Prevent email change on edit
        />
      </div>
      <div className="mb-4">
        <label htmlFor="password"
               className="block text-gray-200 text-sm font-bold mb-2">
          Password {isEditing ? '(leave blank to keep current password)' : ''}
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-950 text-gray-200 leading-tight focus:outline-none focus:shadow-outline"
          required={!isEditing}
        />
      </div>
      <div className="mb-6">
        <label htmlFor="role" className="block text-gray-200 text-sm font-bold mb-2">Role</label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-950 text-gray-200 leading-tight focus:outline-none focus:shadow-outline"
        >
          <option value={Role.USER}>User</option>
          <option value={Role.LEADER}>Leader</option>
          <option value={Role.ADMIN}>Admin</option>
        </select>
      </div>
      <div className="flex items-center justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          {isEditing ? 'Update User' : 'Create User'}
        </button>
      </div>
    </form>
  );
}
