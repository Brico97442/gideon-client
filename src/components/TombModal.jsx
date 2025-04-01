import { useEffect, useState } from 'react';
import { QRCodeCanvas } from "qrcode.react";
import { isMobile } from 'react-device-detect';
import { useTomb } from '../context/TombContext';
import { highlightTombSection } from '../utils/ColorsUtils';
import { formatDate } from '../utils/DateUtils';
import modalRightBackground from '../assets/ui_element/right-modal.png';
import modalRightBackgroundLong from '../assets/ui_element/right-modal-long.png';
import modalRightTopBackground from '../assets/ui_element/right-modal-top.png';
import modalRightBottomBackground from '../assets/ui_element/right-modal-bottom.png';
import modalRightMidBackground from '../assets/ui_element/right-modal-mid.png';
import closeBtn from '../assets/ui_element/close_btn.svg';
import PropTypes from 'prop-types';
import axios from 'axios';
import Button from './Button';

// Définition des couleurs des sections
const sectionColors = {
  89: '#f7d0db',
  90: '#fff5c2',
  91: '#cbb8de',
  92: '#E0C2B6',
};

const TombModal = ({ isOpen, onClose }) => {
  const { selectedTomb, tombDetails = [], tombClones } = useTomb(); // Ajout d'une valeur par défaut pour tombDetails
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [lastname, setLastname] = useState('');
  const [firstname, setFirstname] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [comment, setComment] = useState('');
  const [formStatus, setFormStatus] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  let touchStartY = 0;
  let touchEndY = 0;

  useEffect(() => {
    if (selectedTomb && tombClones.length > 0) {
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

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 20);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const qrValue = `https://gideon-lilac.vercel.app/?name=${encodeURIComponent(selectedTomb)}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
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

  const modalPositionClass = isVisible ? "right-1" : "-right-full";
  const modalPositionClassMobile = isVisible ? "right-0" : "-right-full";

  const modalHeight = tombDetails && tombDetails.length > 1 ? 'h-[100%]' : 'h-[70%]';
  const customWidth = tombDetails && tombDetails.length > 1 ? '100' : '80';
  const customBackground = tombDetails && tombDetails.length > 1 ? modalRightBackgroundLong : modalRightBackground;
  return (
    <div id="ui" className={`lg:block lg:w-[26%] w-full absolute ${isMobile ? modalPositionClassMobile : modalPositionClass} transition-all duration-1000 ease-in-out px-4 lg:px-0 pt-4 lg:pt-[13vh] lg:pb-0 pb-4 ${modalHeight} z-50 `}>
      <div className={`w-full lg:pr-2 lg:pb-2 h-full relative ${isMobile ? "bg-white/50 border border-white rounded-lg backdrop-blur-xs drop-shadow-lg" : "bg-transparent border-none"} bg-amber-400`}>
        {/* {(!isMobile && <img src={modalRightBackground} alt="modal droite background " width={400} className="h-full w-full object-fill absolute top-0 left-0 opacity-95" />)} */}
        <div className="modal-shape-container relative flex flex-col items-center h-full text-dark-green ">
          <div className='h-full w-full absolute top-0 left-0'>
            {/* {(!isMobile && <img src={modalRightTopBackground} alt="modal droite background " width={400} className="h-auto w-full object-fill opacity-95" />)} */}
            {(!isMobile && <img src={customBackground} alt="modal droite background " width={450} className="h-full w-full  object-fill  opacity-95" />)}
            {/* {(!isMobile && <img src={modalRightBottomBackground} alt="modal droite background " width={400} className="h-auto w-full  absolute bottom-0 object-fill  left-0 opacity-95" />)} */}

          </div>
          {/* {(!isMobile && <img src={modalRightTopBackground} alt="modal droite background " width={400} className="h-auto w-full object-fill opacity-95" />)} */}
          <div className="flex flex-col items-center w-full h-full overflow-hidden ">
            {/* {(!isMobile && <img src={modalRightBottomBackground} alt="modal droite background " width={400} className="h-auto w-full object-fill absolute bottom-0 left-0 opacity-95" />)} */}

            <div id="qr-code" className={` ${isMobile ? "hidden" : "flex"} bg-apple-green justify-center border z-50 border-lite-blue items-center p-2 rounded-xl mt-[4vh]`}>
              <QRCodeCanvas value={qrValue} size={customWidth} bgColor="#C7D64F" fgColor="#174C53" />
            </div>

            <div className="flex h-full w-full lg:w-full flex-col mt-4 overflow-hidden">
              <div
                className={`z-50 left-0 h-full rounded-lg transform transition-all duration-700 ease-out ${isCommentOpen ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`}
              >
                {tombDetails && tombDetails.length > 0 && !isCommentOpen && (
                  <div className="my-[10px] mx-5 lg:mx-0 overflow-hidden flex flex-col items-center justify-center">
                    <h2 className="text-[1em] ">Emplacement n°{selectedTomb}</h2>
                    <h3 className="mt-[1vh] lg:mb-[1vh] text-[1em]">Ici repose</h3>

                    <div className="h-full flex items-center flex-col overflow-hidden lg:max-h-[32vh] max-h-[58vh]">
                      <div id='scroll' className="space-y-[2.1vh] lg:mx-5 flex-col items-center overflow-y-auto lg:mt-[0vh]">
                        {tombDetails.map((person, index) => (
                          <div key={index} className="flex-col flex">
                            <span className="flex justify-center text-[1.5em] font-semibold capitalize w-full text-ellipsis">
                              {person.firstname} {person.lastname}
                            </span>
                            <span className="flex lg:gap-4 flex-col lg:flex-row lg:space-x-2 space-y-2 lg:space-y-0 normal-case text-left text-[1em] lg:mx-5">
                              <li className='list-disc leading-none lg:flex'>Née le {formatDate(person.birthdate)}</li>
                              <li className='list-disc leading-none lg:flex text-left'>Décédé le {formatDate(person.deathDate)}</li>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div
                className={`z-50 absolute top-0 left-0 h-full w-full rounded-lg transform transition-all duration-700 ease-out ${isCommentOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
              >
                {isCommentOpen && (
                  <div id="comments" className="w-full h-full px-5 py-3">
                    <form onSubmit={handleSubmit} className="h-full w-full relative pt-14 overflow-hidden">
                      <input
                        type="text"
                        value={lastname}
                        onChange={(e) => setLastname(e.target.value)}
                        placeholder="Nom"
                        className={`w-full placeholder:text-dark-green placeholder:uppercase h-10 border-b mb-4 focus:outline-none bg-transparent text-dark-green  transform transition-all duration-700 ease-out ${isCommentOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} `}
                      />
                      <input
                        type="text"
                        value={firstname}
                        onChange={(e) => setFirstname(e.target.value)}
                        placeholder="Prénom"
                        className={`w-full placeholder:text-dark-green placeholder:uppercase h-10 border-b mb-4 focus:outline-none bg-transparent text-dark-green  transform transition-all duration-700 ease-out${isCommentOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
                      />
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Numéro de téléphone"
                        className={`w-full placeholder:text-dark-green placeholder:uppercase h-10 border-b mb-4 focus:outline-none bg-transparent text-dark-green  transform transition-all duration-700 ease-out${isCommentOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
                      />
                      <textarea
                        value={comment}
                        className={`w-full placeholder:text-dark-green placeholder:uppercase h-auto border-b mb-4 focus:outline-none bg-transparent text-dark-green  transform transition-all duration-700 ease-out${isCommentOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
                        placeholder="Laisser un message"
                        onChange={(e) => setComment(e.target.value)}
                      />
                      {formStatus === 'success' && <p className="text-green-800 mt-1">Commentaire envoyé avec succès!</p>}
                      {formStatus === 'error' && <p className="text-red-800 mt-1">Erreur l&apos;envoi du commentaire.</p>}
                      {isCommentOpen &&
                        <div className="w-full absolute bottom-3 lg:px-2">
                          <Button type="submit" className="lg:h-[76px] w-full rounded-lg bg-[#0E1C36] hover:bg-[#0E1C36]/70 text-white hover:text-green-300 transition-all duration-150" btnValue="Envoyer" />
                        </div>}
                    </form>
                  </div>
                )}
              </div>

            </div>
            {isMobile && !isCommentOpen &&
              <div className='w-full z-40 px-5 mb-3' onClick={() => setIsCommentOpen(!isCommentOpen)}>
                <Button btnValue="Laisser un commentaire" className='cursor-pointer h-[82px]' />
              </div>
            }
            {(!isMobile &&
              <div className='w-full pl-8 pr-6 pb-5' onClick={handleClose} id='btn_close_modal-desktop'>
                <Button btnValue="Retour" />
              </div>
            )}
          </div>
        </div>
        {isMobile && !isCommentOpen && <button onClick={handleClose} id='btn_close_modal-mobile' className='absolute top-[16px] right-[16px] h-[43px] w-[43px] z-50 rounded-full flex justify-center items-center cursor-pointer'><img src={closeBtn} alt="modal droite background" width={400} className="h-full w-[400px] object-fill absolute top-0 left-0" /></button>}
        {isMobile && isCommentOpen && <button onClick={() => setIsCommentOpen(false)} id='btn_close_modal-mobile' className='absolute top-[16px] right-[16px] h-[43px] w-[43px] z-50 rounded-full flex justify-center items-center cursor-pointer'><img src={closeBtn} alt="modal droite background" width={400} className="h-full w-[400px] object-fill absolute top-0 left-0" /></button>}
      </div>
    </div>
  );
};

TombModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  tombName: PropTypes.string,
  tombId: PropTypes.object,
  onTombClick: PropTypes.func
};

export default TombModal;