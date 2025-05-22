import GoToProgramm from "../components/GoToProgramm"

const Home = () => {
  return (
    <>
       <section className="bg-blue-200 min-h-screen flex flex-col items-center justify-center text-center px-4">
        <h1  className="font-funnel font-bold text-4xl ">Spotify - Taylor's Version</h1>
        <h2>Log in to your Spotify account and all the songs in your playlists that are not Taylor's Version will
            be replaced automatically!
        </h2>
        <GoToProgramm />
      </section>
    </>
  )
}

export default Home