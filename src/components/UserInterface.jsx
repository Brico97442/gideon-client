import React from 'react';
import SearchIcon from '../assets/searchicon.svg'
function UserInterface({ tombName, setTombName, focusOnObject }) {


    const handleTopView = () => {
        if (camera) {
          gsap.to(camera.position, {
            x: 0,
            y: 0,  // Position au-dessus de la scène
            z: 0, // Légèrement décalé pour éviter d'être pile sur l'origine
            duration: 1,
            ease: "power2.out",
          });
    
          if (orbitControlRef.current) {
            gsap.to(orbitControlRef.current.target, {
              x: 0,
              y: 0,
              z: 0,
              duration: 1,
              ease: "power2.out",
              // onUpdate: () => {
              //   orbitControlRef.current.update();
              // },
            });
          }
        }
      };
    return (

        <div id='ui' className="hidden lg:block absolute left-0 pl-5 py-6 h-full z-50">
            <div className="relative font-orbitron uppercase flex flex-col items-center justify-between bg-linear-to-b from-[#1E0E36]/80 to-[#27509C]/80 px-7 rounded-3xl h-full w-[475px] text-white py-6">
                <form className='w-full flex flex-col justify-between'>
                    <h1 className='font-bold text-[42px] w-full text-center tracking-[0.4em] h-[94px] border-b'>GIDEON</h1>
                    <h2 className='font-orbitron mt-6 mb-[67px] text-xl tracking-wide font-normal'>Rechercher un defunt</h2>
                    <input
                        type="text"
                        value={tombName}
                        onChange={(e) => setTombName(e.target.value)}
                        placeholder="Nom"
                        className="w-full placeholder:text-white placeholder:uppercase h-10 border-b mb-4 focus:outline-none"
                    />
                    <input
                        type="text"
                        // value={tombName} 
                        // onChange={(e) => setTombName(e.target.value)} 
                        placeholder="Prénom"
                        className="w-full placeholder:text-white placeholder:uppercase h-10 border-b mb-4 focus:outline-none"
                    />
                    <input
                        type="text"
                        // value={tombName} 
                        // onChange={(e) => setTombName(e.target.value)} 
                        placeholder="Date de décès"
                        className="w-full border-b mb-4 h-10 placeholder:uppercase focus:outline-none "
                    />
                    <input
                        type="text"
                        // value={tombName} 
                        // onChange={(e) => setTombName(e.target.value)} 
                        placeholder="Nom de naissance"
                        className="w-full placeholder:text-white placeholder:uppercase h-10 border-b mb-4 focus:outline-none "
                    />
                </form>
                <button id='top-view-btn'className="absolute cursor-pointer top-[50px] -right-[180px] h-30 w-30 rounded-full bg-orange-400/80">Vue du dessus</button>

                <button onClick={() => focusOnObject(tombName)} className="cursor-pointer rounded-lg relative flex items-center justify-center h-[76px] w-full bg-[#0E1C36] tracking-widest uppercase">
                    <img src={SearchIcon} className='font-orbitron absolute left-0 h-full p-4 ' />
                    Rechercher
                </button>

            </div>
        </div>
    );
}

export default UserInterface;
