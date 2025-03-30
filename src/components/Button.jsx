import { useState } from 'react';
import btnImg from '../assets/ui_element/btn2.png';
import btnHoveredImg from '../assets/ui_element/btn_hover.webp';

export default function Button({ btnValue }) {
    const [isActive, setIsActive] = useState(false);

    const handleClick = () => {
        setTimeout(() => {
            setIsActive(true);
        }, 100);
        setTimeout(() => {
            setIsActive(false);
        }, 500);
    };

    return (
        <div>
            <div 
                className="w-full h-[82px] lg:h-[8.5vh] lg:px-0 text-white transition-all duration-1000 cursor-pointer relative flex justify-center"
            >
                <button className='relative w-full h-full flex justify-center' onClick={handleClick} >
                    <p className='font-orbitron tracking-widest absolute h-[66%] z-60 text-[1rem] lg:text-[1.25rem] flex items-center justify-center w-full'>{btnValue}</p>
                    <img 
                        src={isActive ? btnHoveredImg : btnImg} 
                        alt="background" 
                        height={104} 
                        className="absolute w-full top-0 left-0 h-[82px] lg:h-[8.5vh] object-fill z-0 transition-all duration-1000" 
                    /> 
                </button>
            </div>
        </div>
    );
}