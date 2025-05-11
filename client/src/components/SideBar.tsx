import { Box, Flex, Text, Icon } from "@chakra-ui/react";
import { FaSnowflake, FaUserCog, FaUsers } from "react-icons/fa";
import { GiIcebergs } from "react-icons/gi";
import { IconType } from "react-icons/lib";
import { FaMapLocationDot } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";

interface SideBarProps {
  username: string | undefined;
  is_superuser: boolean | undefined;
  // action when clicking items
  onNavigate?: () => void;
}

const Sidebar = ({ username, is_superuser, onNavigate }: SideBarProps) => {
  const navigate = useNavigate();

  const onButtonClick = (dest: string) => {
    navigate(dest);
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <Flex>
      <Box
        position="fixed"
        top="0"
        left="0"
        width="220px"
        height="100vh"
        bg="gray.800"
        color="white"
        boxShadow="md"
        p="4"
      >
        <Flex direction="column" align="flex-start">
          {/* main page */}
          <SidebarItem
            icon={FaSnowflake}
            label="Icebergs"
            onClick={() => onButtonClick("/")}
          />
          {/* map page (jump from home or directly navigate) */}
          <SidebarItem
            icon={FaMapLocationDot}
            label="Map"
            onClick={() => onButtonClick("/map")}
          />
          <SidebarItem icon={FaUsers} label="User Settings" />
          {is_superuser && <SidebarItem icon={FaUserCog} label="Admin" />}
        </Flex>
      </Box>
      <Box
        position="fixed"
        bottom="0.5vh"
        left="0"
        width="220px"
        height="10vh"
        color="white"
        boxShadow="md"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Icon as={GiIcebergs} color="white" fontSize="lg" mr={4} />
        <Text fontSize="lg" textAlign="center" color="white" mt={3}>
          {username ? username : "Guest User"}
        </Text>
      </Box>
    </Flex>
  );
};

interface SidebarItemProps {
  icon: IconType;
  label: string;
  onClick?: () => void;
}

const SidebarItem = ({ icon, label, onClick }: SidebarItemProps) => {
  return (
    <Flex
      alignItems="center"
      p="2"
      mb="4"
      borderRadius="md"
      width="100%"
      onClick={onClick}
      _hover={{ bg: "gray.700", cursor: "pointer" }}
    >
      <Text fontSize="xl" textAlign="center">
        <Icon as={icon} color="white" fontSize="xl" mr="4" />
        {label}
      </Text>
    </Flex>
  );
};

export default Sidebar;
