import React from 'react';
import { QRCodeCanvas } from "qrcode.react";
import { isMobile } from 'react-device-detect';
const TombModal = ({ isOpen, onClose, tombName, tombDetails }) => {
  if (!isOpen) return null;

  const qrValue = `https://gideon-lilac.vercel.app/?name=${encodeURIComponent(tombName)}`;

  return (
    <div className="lg:block absolute right-0 p-6 h-full z-50">
      <div className="bg-linear-to-b from-[#1E0E36]/80 to-[#27509C]/80 text-white h-full w-[475px] flex flex-col justify-between z-50 p-7 rounded-3xl">
        
        <div id="qr-code" className={`w-full ${isMobile? "hidden":"flex"} flex justify-center items-center h-1/3 p-6 border-b`}>
          <QRCodeCanvas value={qrValue} size={200} bgColor="#ffffff" fgColor="#000000" />
        </div>
        
        <div className="flex h-full justify-between flex-col">
          <div>
            <h1>Section</h1>
            <h2 className="my-3 text-xs">Numéro d'emplacement</h2>
            <p className="mb-4 uppercase">{tombName}</p>
          </div>

          <h3 className="font-semibold">Ici repose</h3>
          {tombDetails && tombDetails.length > 0 && (
          <div className="my-4 h-full bg-amber-500">
              <ul className="flex overflow-y-scroll flex-col h-full">
                {tombDetails.map((person, index) => (
                  <li key={index} className="my-2 flex flex-col">
                    <span>{person.firstname} {person.lastname}</span>
                    <span>Née le{new Date(person.birthdate).toLocaleDateString()}</span>
                    <span>Mort le{new Date(person.deathDate).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

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
