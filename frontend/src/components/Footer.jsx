import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div>
          <h4>About</h4>
          <Link to="/about">About Us</Link>
          <Link to="/team">Our Team</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/contact">Contact Us</Link>
          <Link to="/verify">Shelter Verification</Link>
        </div>

        <div>
          <h4>Adoption</h4>
          <Link to="/browse-pets">Browse Pets</Link>
          <Link to="/favorites">Favorites</Link>
          <Link to="/conversations">Messages</Link>
        </div>

        <div>
          <h4>Resources</h4>
          <Link to="/user-faq">FAQ</Link>
          <Link to="/pet-care">Pet Care</Link>
          <Link to="/guidelines">Guidelines</Link>
        </div>

        <div>
          <h4>Shelters</h4>
          <Link to="/shelters">For Shelters</Link>
          <Link to="/post-pet">Post a Pet</Link>
          <Link to="/partner">Partner With Us</Link>
          <Link to="/admin-faq">FAQ for Shelters</Link>
        </div>
      </div>

      <p className="footer-bottom">© 2026 PawMatch</p>
    </footer>
  );
}

export default Footer;