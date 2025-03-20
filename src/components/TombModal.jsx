import { useEffect, useState } from 'react';
import { QRCodeCanvas } from "qrcode.react";
import { isMobile } from 'react-device-detect';
import { useTomb } from '../context/TombContext';
import { highlightTombSection } from '../utils/ColorsUtils';
import { formatDate } from '../utils/DateUtils';
import modalRightBackground from '../assets/ui_element/right-modal.webp';
import PropTypes from 'prop-types';
import axios from 'axios';
import Button from './Button';

const TombModal = ({ isOpen, onClose }) => {
  const { selectedTomb, tombDetails, tombClones } = useTomb();
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [lastname, setLastname] = useState('');
  const [firstname, setFirstname] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [comment, setComment] = useState('');
  const [formStatus, setFormStatus] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  // Variables pour stocker les positions de départ et de fin du toucher
  let touchStartY = 0;
  let touchEndY = 0;

  // Gestion de l'animation à l'ouverture
  useEffect(() => {
    if (isOpen) {
      // Un petit délai pour permettre au composant de se rendre avant d'animer
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

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
        handleClose(); // Utiliser handleClose au lieu de onClose directement
      }
    };

    const modalElement = document.getElementById('ui');
    if (modalElement && isOpen) {
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
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // if (!isOpen) return null;

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

  const modalPositionClass = isVisible ? "right-0" : "-right-[450px]";

  return (
    <div id="ui" className={`lg:block lg:w-auto absolute ${modalPositionClass} transition-all duration-1000 ease-in-out mx-2 py-2 lg:mr-3 lg:py-6 h-full z-50`}>
      <div className="w-full lg:w-[400px] lg:pl-[48px] lg:pr-[37.4px] lg:pb-[55px] pt-7 h-full relative">
        <img src={modalRightBackground} alt="modal droite background" width={400} className="h-full w-[400px] object-fill absolute top-0 left-0" />
        <div className="modal-shape-container relative font-orbitron flex flex-col items-center h-full text-dark-green">
          <div className="flex flex-col items-center h-full">
            <div id="qr-code" className={` ${isMobile ? "hidden" : "flex"} bg-apple-green justify-center items-center p-2 rounded-xl`}>
              <QRCodeCanvas value={qrValue} size={150} bgColor="#C7D64F" fgColor="#174C53" />
            </div>
            <div className="flex h-full w-auto lg:w-full flex-col px-[19px] mt-8">
              <h2 className="text-[18px]">Emplacement n°{selectedTomb}</h2>
              {tombDetails && (
                <div className="my-[22px] box-border overflow-hidden">
                  <h3 className='mb-3'>Ici repose</h3>
                  <div className='h-full flex flex-col'>
                    <ul className="space-y-2 flex-col max-h-[30vh] overflow-y-auto">
                      {tombDetails.map((person, index) => (
                        <li key={index} className="flex-col flex">
                          <span className='text-lg font-semibold capitalize underline'>{person.firstname} {person.lastname}</span>
                          <span className='flex space-x-6 normal-case'><span>* Née le {formatDate(person.birthdate)}</span> <span>* Décédé le {formatDate(person.deathDate)}</span></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {isMobile && <button onClick={() => setIsCommentOpen(!isCommentOpen)} className='h-10 w-10 z-50 rounded-full flex justify-center items-center bg-dark-green cursor-pointer'>i</button>}              
              {isCommentOpen && (
                <div id='comments' className='absolute top-0 left-0 w-full h-full bg-yellow-500'>
                  <form onSubmit={handleSubmit} className='h-full w-full'>
                    <input
                      type="text"
                      value={lastname}
                      onChange={(e) => setLastname(e.target.value)}
                      placeholder="Nom"
                      className="w-full placeholder:text-white placeholder:uppercase h-10 border-b mb-4 focus:outline-none bg-transparent text-white"
                    />
                    <input
                      type="text"
                      value={firstname}
                      onChange={(e) => setFirstname(e.target.value)}
                      placeholder="Prénom"
                      className="w-full placeholder:text-white placeholder:uppercase h-10 border-b mb-4 focus:outline-none bg-transparent text-white"
                    />
                    <input
                      type='text'
                      value={phoneNumber}
                      placeholder='Numéro de téléphone'
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full placeholder:text-white placeholder:uppercase h-10 border-b mb-4 focus:outline-none bg-transparent text-white"
                    />
                    <textarea
                      value={comment}
                      className='w-full placeholder:text-white placeholder:uppercase h-auto border-b mb-4 focus:outline-none bg-transparent text-white'
                      placeholder='Laisser un message'
                      onChange={(e) => setComment(e.target.value)}
                    />
                    <button type='submit' className="h-10 lg:h-[76px] w-full rounded-lg bg-[#0E1C36] hover:bg-[#0E1C36]/70 text-white hover:text-green-300 transition-all duration-150">Envoyer</button>
                  </form>
                  {formStatus === 'success' && <p className="text-green-500 mt-2">Commentaire envoyé avec succès!</p>}
                  {formStatus === 'error' && <p className="text-red-500 mt-2">Erreur lors de l'envoi du commentaire.</p>}
                </div>
              )}
            </div>
            <div className='w-full' onClick={handleClose}>
              <Button btnValue="Retourner à l'Accueil"/>
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