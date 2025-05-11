import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import axios from "axios";
import { Box, Flex, IconButton, Input } from "@chakra-ui/react";
import { FaSearch } from "react-icons/fa";
import { IcebergInfo, Message } from "../types/types";
import Sidebar from "../components/SideBar";
import IcebergInfoTable from "../components/IcebergInfoTable";
import { useUser } from "../hooks/useUser";
import { isLoggedIn } from "../hooks/useAuth";
import { Toast, ToastContainer } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [allIcebergs, setAllIcebergs] = useState<IcebergInfo[]>([]);
  const [filteredIcebergs, setFilteredIcebergs] = useState<IcebergInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [message, setMessage] = useState<Message>({
    message: "Log in to access more iceberg info!",
    msgVariant: "info",
    msgVisible: false,
  });
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const handleCardClick = (iceberg_id: string) => {
    console.log(`Logged in: ${isLoggedIn()}, user: ${user?.username}`);
    if (isLoggedIn() && user) {
      navigate(`/map`, {
        state: {
          iceberg_id: iceberg_id,
          user_name: user.username,
          is_superuser: user.is_superuser,
        },
      });
    } else {
      setMessage((prevMessage) => ({
        ...prevMessage,
        msgVisible: true,
      }));
    }
  };
  const fetchAPI = async () => {
    const response = await axios.get("http://localhost:8080/iceberg_info/new_data");
    const allIcebergs = response.data;
    // filter data based on searching criterion
    const filteredData = allIcebergs.filter((iceberg: IcebergInfo) => {
      const recentDate = new Date(iceberg.recent_observation);
      const threshold = new Date("2024-12-01");
      return recentDate >= threshold;
    });
    setAllIcebergs(allIcebergs);
    setFilteredIcebergs(filteredData);
  };

  const handleSearch = () => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const searchResults = allIcebergs.filter((iceberg) => {
      return iceberg.iceberg_id.toLowerCase().includes(lowerSearchTerm);
    });
    const sortedResults = searchResults.sort((a, b) => {
      const dateA = new Date(a.recent_observation);
      const dateB = new Date(b.recent_observation);
      return dateB.getTime() - dateA.getTime();
    });
    setFilteredIcebergs(sortedResults.slice(0, 10));
  };

  const handleSigningOut = () => {
    setUser({
      username: "",
      is_signedIn: false,
    });
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  // fetch data from backend api
  useEffect(() => {
    fetchAPI();
  }, []);

  return (
    <>
      <Flex>
        <Sidebar username={user?.username} is_superuser={user?.is_superuser} />
        <ToastContainer position="top-center" className="text-center">
          <Toast
            onClose={() =>
              setMessage((prevMessage) => ({
                ...prevMessage,
                msgVisible: false,
              }))
            }
            show={message.msgVisible}
            bg={message.msgVariant}
            delay={2000}
            autohide
          >
            <Toast.Body className="text-white">{message.message}</Toast.Body>
          </Toast>
        </ToastContainer>
        <Box ml="220px" p="4" w="full">
          <NavBar
            isSignedIn={user?.is_signedIn}
            onSignedOut={handleSigningOut}
          />
          <Flex
            direction="column"
            align="center"
            justify="center"
            mb={6}
            w="full"
            p={4}
          >
            <Flex w="full" maxWidth="600px" align="center" justify="center">
              <Input
                placeholder="Search iceberg by name..."
                size="lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key == "Enter" && handleSearch()}
                mr={2}
              />
              <IconButton
                aria-label="Search Icebergs"
                icon={<FaSearch />}
                onClick={handleSearch}
              />
            </Flex>
          </Flex>
          <IcebergInfoTable
            icebergs={filteredIcebergs}
            handleCardClick={handleCardClick}
          />
        </Box>
      </Flex>
    </>
  );
};

export default Home;
