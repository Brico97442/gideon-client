import React from 'react';

function UserInterface({ tombName, setTombName, focusOnObject }) {
    return (
        <div id='ui' className="hidden lg:block absolute left-0 pl-5 py-6 h-full w-[500px] z-50">
            <div className=" font-orbitron uppercase bg-linear-to-r from-[#1E0E36]/80 to-[#27509C]/80 px-7 rounded-3xl h-full w-full text-white py-6">
                <h1 className='font-bold text-4xl w-full text-center tracking-[0.6em] border-b'>GIDEON</h1>
                <h2 className='my-6 text-xl tracking-normal font-normal'>Rechercher un defunt</h2>
                <form className='w-full flex flex-col justify-between'>
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
                    placeholder="Nom de naissance"
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
                    className="w-full border-b mb-4 h-10 placeholder:uppercase focus:outline-none"
                />
                </form>
                <button onClick={() => focusOnObject(tombName)} className="search-btn h-16 w-full bg-[#0E1C36]">
                    Lancer la recherche
                </button>
               
            </div>
        </div>
    );
}

export default UserInterface;
