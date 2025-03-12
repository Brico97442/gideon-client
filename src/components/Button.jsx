import { useState } from 'react';
import btnImg from '../assets/ui_element/btn.png';
import btnHoveredImg from '../assets/ui_element/btn_hover.png';

export default function Button({ btnValue }) {
    const [isActive, setIsActive] = useState(false);

    const handleClick = () => {
        setTimeout(() => {
            setIsActive(true);
        }, 100);
        setTimeout(() => {
            setIsActive(false);
        }, 600);
    };

    return (
        <div>
            <div 
                className="w-full h-[104px] lg:px-0 text-white transition-all duration-1000 cursor-pointer relative flex justify-center"
            >
                <button className='relative w-full h-full' onClick={handleClick}>
                    <p className='absolute top-6 z-60 w-full'>{btnValue}</p>
                    <img 
                        src={isActive ? btnHoveredImg : btnImg} 
                        alt="background" 
                        width={416} 
                        height={104} 
                        className="absolute top-0 left-0 h-[104px] object-fill z-0 transition-all duration-1000" 
                    />
                </button>
            </div>
        </div>
    );
}