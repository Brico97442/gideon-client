import React from 'react';
import { QRCodeCanvas } from "qrcode.react";
import { isMobile } from 'react-device-detect';
const TombModal = ({ isOpen, onClose, tombName, tombDetails }) => {
  if (!isOpen) return null;

  const qrValue = `https://gideon-lilac.vercel.app/?name=${encodeURIComponent(tombName)}`;

  return (
    <div className="lg:block w-auto absolute right-0 p-6 h-full z-[40] ">
      <div className="bg-linear-to-b from-[#1E0E36]/80 to-[#27509C]/80 backdrop-blur-[4px] text-white h-full lg:w-[475px] flex flex-col justify-between z-40 p-7 rounded-3xl">
        
        <div id="qr-code" className={`w-full ${isMobile? "hidden":"flex"} flex justify-center items-center h-1/3 p-6 border-b`}>
          <QRCodeCanvas value={qrValue} size={200} bgColor="#ffffff" fgColor="#000000" />
        </div>
        
        <div className="flex h-full pt-3 justify-between flex-col">
          <div>
            {/* <h1>Section</h1> */}
            <h2 className="my-3">Emplacement n°{tombName}</h2>
          </div>
          {tombDetails && tombDetails.length > 0 && (
          <div className="my-4 box-border max-h-[300px] overflow-hidden ">
              <div className='h-full flex flex-col '>

              <ul className="block overflow-y-scroll space-y-2 flex-col h-full">
                {tombDetails.map((person, index) => (
                  <li key={index} className="flex-col flex">
                    <span className='text-lg font-semibold underline'>{person.firstname} {person.lastname}</span>
                    <span className='flex space-x-6'><span>Née le {new Date(person.birthdate).toLocaleDateString()}</span><span>Mort le {new Date(person.deathDate).toLocaleDateString()}</span></span>
                  </li>
                ))}
              </ul>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="h-10 lg:h-[76px] w-full  uppercase rounded-lg bg-[#0E1C36] hover:bg-[#0E1C36]/70  text-white hover:text-green-300 transition-all duration-150"
          >
            Retourner à l'Accueil
          </button>
        </div>
      </div>
    </div>
  );
};

export default TombModal;
