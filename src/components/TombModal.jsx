import React from 'react';
import { QRCodeCanvas } from "qrcode.react";
// import { API_URL } from '../config/api';


const TombModal = ({ isOpen, onClose, tombName }) => {

  if (!isOpen) return null;

  const qrValue = `https://gideon-lilac.vercel.app/?name=${encodeURIComponent(tombName)}`;
  console.log(qrValue)

  return (
    <div className='hidden lg:block absolute right-0 p-6 h-full z-50'>
      <div className="bg-linear-to-b from-[#1E0E36]/80 to-[#27509C]/80 text-white h-full w-[475px] flex flex-col justify-between z-50 p-7 rounded-3xl">
        <div id='qr-code' className="w-full flex justify-center items-center h-1/3 p-6 border-b">
          <QRCodeCanvas value={qrValue} size={200} bgColor="#ffffff" fgColor="#000000" />
        </div>
        <div className='flex h-full justify-between flex-col'>
          <div className=''>
            <h2 className="my-3 text-xs">Nom</h2>
            <p className="mb-4 uppercase">{tombName}</p>
          </div>
          <button
            onClick={onClose}
            className="h-[76px] w-full bg-green-400 uppercase rounded-lg text-white hover:bg-gray-700"
          >
            Retourner à l'Accueil 
          </button>
        </div>
      </div>
    </div>
  );
};

export default TombModal;