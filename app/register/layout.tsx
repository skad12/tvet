import "../../app/globals.css";
import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";

export default function RegisterLayout({ children }) {
  return (
    <>
      <NavBar />
      {children}
      <div className="pt-42">
        <Footer />
      </div>
    </>
  );
}
