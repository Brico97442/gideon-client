import { useState } from 'react';
import btnImg from '../assets/ui_element/btn.webp';
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
                className="w-full h-[82px] lg:h-[9vh] lg:px-0 text-white transition-all duration-1000 cursor-pointer relative flex justify-center"
            >
                <button className='relative w-full h-full' onClick={handleClick}>
                    <p className='font-avenir tracking-widest absolute top-3 lg:top-[1vh] z-60 text-[1.15em] w-full'>{btnValue}</p>
                    <img 
                        src={isActive ? btnHoveredImg : btnImg} 
                        alt="background" 
                        height={104} 
                        className="absolute w-full top-0 left-0 h-[82px] lg:h-[9vh] object-fill z-0 transition-all duration-1000" 
                    /> 
                </button>
            </div>
        </div>
    );
}