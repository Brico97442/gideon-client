import { useEffect } from 'react';
import { QRCodeCanvas } from "qrcode.react";
import { isMobile } from 'react-device-detect';
import { useTomb } from '../context/TombContext';
import { highlightTombSection } from '../utils/ColorsUtils';
import PropTypes from 'prop-types';

const TombModal = ({ isOpen, onClose }) => {
  const { selectedTomb, tombDetails, tombClones } = useTomb();

  useEffect(() => {
    if (selectedTomb && tombClones.length > 0) {
      const sectionColors = {
        13: '#EF507E',
        14: '#FFE771',
        15: '#B89AD7',
        16: '#E0C2B6',
      };
      highlightTombSection(tombClones, selectedTomb, sectionColors);
    }
  }, [selectedTomb, tombClones]);

  if (!isOpen) return null;

  const qrValue = `https://gideon-lilac.vercel.app/?name=${encodeURIComponent(selectedTomb)}`;
  // console.log(qrValue)
  
  return (
    <div id="ui" className=" lg:block w-full lg:w-auto  absolute right-0 px-2 lg:px-5 py-6 h-full z-50">
      <div className="modal-shape-container-background w-full h-full p-4">
        <div className="modal-shape-container relative font-orbitron flex flex-col items-center justify-between h-full lg:w-[460px] text-white">
          <div className="modal-shape-border"></div>
          <div className="modal-shape-inner bg-gradient-to-b from-[#3D52CA]/80  via-[#001278]/80 to-[#3D52CA]/80 flex flex-col items-center ">
            <div id="qr-code" className={`w-full ${isMobile ? "hidden" : "flex"} flex justify-center items-center h-1/3 p-6 border-b`}>
              <QRCodeCanvas value={qrValue} size={200} bgColor="#ffffff" fgColor="#000000" />
            </div>
            <div className="flex h-full w-auto lg:w-full pl-8 pt-6 pr-6 pb-6 justify-between flex-col">
              <div>
                <h2 className="">Emplacement n°{selectedTomb}</h2>
              </div>
              {tombDetails && (
                <div className="my-4 box-border max-h-[300px] overflow-hidden ">
                  <h3 className='mb-3'>Ici repose</h3>
                  <div className='h-full flex flex-col '>

                    <ul className="block overflow-y-scroll space-y-2 flex-col h-full">
                      {tombDetails.map((person, index) => (
                        <li key={index} className="flex-col flex">
                          <span className='text-lg font-semibold capitalize underline'>{person.firstname} {person.lastname}</span>
                          <span className='flex space-x-6 normal-case'><span>* Née le {new Date(person.birthdate).toLocaleDateString()}</span><span>* Mort le {new Date(person.deathDate).toLocaleDateString()}</span></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <button
                onClick={onClose}
                className="h-10 lg:h-[76px] w-full rounded-lg bg-[#0E1C36] hover:bg-[#0E1C36]/70 text-white hover:text-green-300 transition-all duration-150"
              >
                Retourner à l'Accueil
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

TombModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default TombModal;
