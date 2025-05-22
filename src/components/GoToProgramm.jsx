import { useNavigate } from 'react-router-dom';
import { runSpotifyWorkflow } from '../myScript'; // adjust path if needed


const GoToProgramm = () => {
    const navigate = useNavigate();

    // Trigger script
     const handleClick = async () => {
        //await runSpotifyWorkflow();
        navigate('/callback');
    }

    return (
    <>
    <section className="m-auto max-w-lg my-10 px-6">
        <button
            onClick={handleClick}
            className="block bg-gray-700 text-white text-center py-4 px-16 rounded-xl hover:bg-red-400"
            >Start
        </button>
        </section>
    </>
    )
}

export default GoToProgramm