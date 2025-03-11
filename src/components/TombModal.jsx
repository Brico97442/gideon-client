import { useEffect, useState } from 'react';
import { QRCodeCanvas } from "qrcode.react";
import { isMobile } from 'react-device-detect';
import { useTomb } from '../context/TombContext';
import { highlightTombSection } from '../utils/ColorsUtils';
import PropTypes from 'prop-types';
import axios from 'axios';

const TombModal = ({ isOpen, onClose }) => {
  const { selectedTomb, tombDetails, tombClones } = useTomb();
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [lastname, setLastname] = useState('');
  const [firstname, setFirstname] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [comment, setComment] = useState('');
  const [formStatus, setFormStatus] = useState(null);

  // Variables pour stocker les positions de départ et de fin du toucher
  let touchStartY = 0;
  let touchEndY = 0;

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

  useEffect(() => {
    const handleTouchStart = (e) => {
      touchStartY = e.changedTouches[0].screenY;
    };

    const handleTouchMove = (e) => {
      touchEndY = e.changedTouches[0].screenY;
    };

    const handleTouchEnd = () => {
      if (touchStartY - touchEndY > 50) {
        // Swipe up
      }
      if (touchEndY - touchStartY > 50) {
        // Swipe down
        onClose(); // Fermer la modal
      }
    };

    const modalElement = document.getElementById('ui');
    if (modalElement) {
      modalElement.addEventListener('touchstart', handleTouchStart);
      modalElement.addEventListener('touchmove', handleTouchMove);
      modalElement.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      if (modalElement) {
        modalElement.removeEventListener('touchstart', handleTouchStart);
        modalElement.removeEventListener('touchmove', handleTouchMove);
        modalElement.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [onClose]);

  if (!isOpen) return null;

  const qrValue = `https://gideon-lilac.vercel.app/?name=${encodeURIComponent(selectedTomb)}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Données envoyées:', {
        firstname,
        lastname,
        phoneNumber,
        comment,
        tomb: parseInt(selectedTomb, 10)
      });
      const response = await axios.post('https://gideon-api.willsprod.fr/comments', {
        firstname,
        lastname,
        phoneNumber,
        comment,
        tomb: parseInt(selectedTomb, 10)
      });
      setFormStatus('success');
      console.log('Commentaire envoyé avec succès:', response.data);
    } catch (error) {
      setFormStatus('error');
      console.error('Erreur lors de l\'envoi du commentaire:', error);
    }
  };

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
              <button onClick={() => setIsCommentOpen(!isCommentOpen)} className='h-10 w-10 rounded-full flex justify-center items-center bg-blue-600 cursor-pointer'>i</button>
              {isCommentOpen && (
                <div id='comments' className='absolute top-0 w-full h-full bg-yellow-500'>
                  <form onSubmit={handleSubmit}>
                    <input
                      type="text"
                      value={lastname}
                      onChange={(e) => setLastname(e.target.value)}
                      placeholder="Nom"
                      className=" placeholder:text-white placeholder:uppercase h-10 border-b mb-4 focus:outline-none bg-transparent text-white"
                    />
                    <input
                      type="text"
                      value={firstname}
                      onChange={(e) => setFirstname(e.target.value)}
                      placeholder="Prénom"
                      className=" placeholder:text-white placeholder:uppercase h-10 border-b mb-4 focus:outline-none bg-transparent text-white"
                    />
                    <input
                      type='text'
                      value={phoneNumber}
                      placeholder='Numéro de téléphone'
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className=" placeholder:text-white placeholder:uppercase h-10 border-b mb-4 focus:outline-none bg-transparent text-white"
                    />
                    <textarea
                      value={comment}
                      className=' placeholder:text-white placeholder:uppercase h-auto border-b mb-4 focus:outline-none bg-transparent text-white'
                      placeholder='Laisser un message'
                      onChange={(e) => setComment(e.target.value)}
                    />
                    <button type='submit' className="h-10 lg:h-[76px] w-full rounded-lg bg-[#0E1C36] hover:bg-[#0E1C36]/70 text-white hover:text-green-300 transition-all duration-150">Envoyer</button>
                  </form>
                  {formStatus === 'success' && <p className="text-green-500 mt-2">Commentaire envoyé avec succès!</p>}
                  {formStatus === 'error' && <p className="text-red-500 mt-2">Erreur lors de l'envoi du commentaire.</p>}
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
