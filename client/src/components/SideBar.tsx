import { Box, Flex, Text, Icon, IconButton } from "@chakra-ui/react";
import { FaSnowflake, FaUserCog, FaUsers, FaBars } from "react-icons/fa";
import { GiIcebergs } from "react-icons/gi";
import { IconType } from "react-icons/lib";
import { FaMapLocationDot } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { LocationState } from "../types/types";

interface SideBarProps {
  username: string | undefined;
  is_superuser: boolean | undefined;
  // optional actions when clicking icons, like closing rightaway
  onNavigate?: () => void;
  isOpen: boolean;
  onToggle: () => void;
  // additional state to pass on
  state?: LocationState;
}

// width constants
export const openWidth = "220px";
export const closeWidth = "60px";

const SideBar = ({
  username,
  is_superuser,
  onNavigate,
  isOpen,
  onToggle,
  state,
}: SideBarProps) => {
  const navigate = useNavigate();

  const onButtonClick = (dest: string) => {
    navigate(dest, { state });
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
        width={isOpen ? openWidth : closeWidth} // Adjusted width
        height="100vh"
        bg="gray.800"
        color="white"
        boxShadow="md"
        p="4"
        transition="width 0.2s ease-in-out"
      >
        <Flex direction="column" align={isOpen ? "flex-start" : "center"}>
          <IconButton
            aria-label="Toggle Sidebar"
            icon={<FaBars />}
            onClick={onToggle}
            variant="ghost"
            color="white"
            fontSize="xl"
            mb="4"
            _hover={{ bg: "gray.700" }}
            alignSelf={isOpen ? "flex-end" : "center"}
          />

          {isOpen && (
            <>
              {/* main page */}
              <SidebarItem
                icon={FaSnowflake}
                label="Icebergs"
                onClick={() => onButtonClick("/")}
                isOpen={isOpen}
              />
              {/* map page */}
              <SidebarItem
                icon={FaMapLocationDot}
                label="Map"
                onClick={() => onButtonClick("/map")}
                isOpen={isOpen}
              />
              <SidebarItem
                icon={FaUsers}
                label="User Settings"
                isOpen={isOpen}
              />
              {is_superuser && (
                <SidebarItem icon={FaUserCog} label="Admin" isOpen={isOpen} />
              )}
            </>
          )}
        </Flex>

        {isOpen && (
          <Box
            position="fixed"
            bottom="0.5vh"
            left="0"
            width={openWidth}
            height="10vh"
            color="white"
            display="flex"
            alignItems="center"
            justifyContent="center"
            pl="4"
            pr="4"
          >
            <Text fontSize="md" textAlign="center" color="white" noOfLines={1}>
              <Icon as={GiIcebergs} color="white" fontSize="lg" mr={2} />
              {username ? username : "Guest User"}
            </Text>
          </Box>
        )}
      </Box>
    </Flex>
  );
};

interface SidebarItemProps {
  icon: IconType;
  label: string;
  onClick?: () => void;
  isOpen: boolean; // To control label visibility if needed, though text handles it
}

const SidebarItem = ({ icon, label, onClick, isOpen }: SidebarItemProps) => {
  return (
    <Flex
      alignItems="center"
      p="2"
      mb="4"
      borderRadius="md"
      width="100%"
      onClick={onClick}
      _hover={{ bg: "gray.700", cursor: "pointer" }}
      justifyContent={isOpen ? "flex-start" : "center"}
    >
      {isOpen && (
        <Text fontSize="xl" textAlign="center">
          <Icon as={icon} color="white" fontSize="xl" mr={isOpen ? "4" : "0"} />
          {label}
        </Text>
      )}
    </Flex>
  );
};

export default SideBar;
