'use client';

import Modal from './Modal';
import { FaExclamationTriangle, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="p-6 bg-gray-800 text-white">
        <div className="flex items-center mb-4">
          <FaExclamationTriangle className="text-yellow-400 text-3xl mr-4" />
          <p className="text-lg">{message}</p>
        </div>
        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={onClose}
            className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200"
          >
            <FaTimesCircle className="mr-2" />
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-800 text-white font-semibold rounded-lg shadow-md transition-colors duration-200"
          >
            <FaCheckCircle className="mr-2" />
            Confirmar Exclusão
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
