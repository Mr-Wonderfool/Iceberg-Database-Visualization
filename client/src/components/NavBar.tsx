import { useState } from "react";
import { Button, Container, Nav, Navbar, NavDropdown } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "../style/App.css";

interface NavBarProps {
  isSignedIn?: boolean;
  onSignedOut: () => void;
}

const NavBar = ({ isSignedIn, onSignedOut }: NavBarProps) => {
  const navigate = useNavigate();
  const [tables] = useState(["User", "IcebergInfo"]); // TODO: modify according to user role

  const handleSignInClick = () => navigate("/signup");
  const handleLogInClick = () => navigate("/login");
  // TODO: visiting table info logic
  const handleTableSelect = (table: string) => {
    navigate(`/table/${table}`);
  };
  return (
    <Navbar expand="lg" className="bg-body-tertiary">
      <Container>
        <Navbar.Brand href="/">Iceberg Database</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <NavDropdown title="Tables" id="basic-nav-dropdown">
              {tables.map((table) => (
                <NavDropdown.Item
                  key={table}
                  onClick={() => handleTableSelect(table)}
                >
                  {table}
                </NavDropdown.Item>
              ))}
            </NavDropdown>
          </Nav>
          <Nav>
            {!isSignedIn ? ( // "/": sign in, log in
              <div>
                <Button
                  variant="outline-primary"
                  onClick={handleSignInClick}
                  style={{ marginRight: "10px" }}
                >
                  Sign Up
                </Button>
                <Button variant="outline-success" onClick={handleLogInClick}>
                  Log in
                </Button>
              </div>
            ) : (
              <Button variant="outline-primary" onClick={onSignedOut}>
                Log Out
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar;
