import { useEffect } from "react";
import { runSpotifyWorkflow } from "../myScript";

const ProgrammPage = () => {

  useEffect(() => {
    runSpotifyWorkflow(); // just resume everything here
  }, []);

  return (
    <>
      <section className="bg-blue-200 min-h-screen flex flex-col items-center justify-center text-center px-4">
        <h1>Carrying out code...</h1>
      </section>
    </>
  )
}

export default ProgrammPage