import React from 'react';
import { QRCodeCanvas } from "qrcode.react";
// import { API_URL } from '../config/api';


const TombModal = ({ isOpen, onClose, tombName }) => {
  
  if (!isOpen) return null;
  
  const qrValue =`http://192.168.1.3:5173/?name=${encodeURIComponent(tombName)}`;
  console.log(qrValue)

  return (
    <div className="absolute right-0 bg-gray-800 p-3 text-white w-[500px] h-full flex flex-col justify-between z-50">
      <div id='qr-code' className="w-full flex justify-center items-center h-1/3 p-6 border-b">
        <QRCodeCanvas value={qrValue} size={250} bgColor="#ffffff" fgColor="#000000" />
      </div>
      <div className='h-full'>
        <h2 className="my-3 text-xs">Nom</h2>
        <p className="mb-4 uppercase">{tombName}</p>
      </div>
      <button
        onClick={onClose}
        className="bg-green-300 text-white px-4 py-2 rounded hover:bg-gray-700"
      >
        Fermer
      </button>
    </div>
  );
};

export default TombModal;