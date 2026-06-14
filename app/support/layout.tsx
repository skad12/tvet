import "../../app/globals.css";
import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";

export default function SupportLayout({ children }) {
  return (
    <>
      <NavBar />
      {children}
      <Footer />
    </>
  );
}
