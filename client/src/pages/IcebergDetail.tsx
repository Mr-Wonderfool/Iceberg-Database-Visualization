import { useEffect, useState } from "react";
import { IcebergDetails } from "../types/types";
import axios from "axios";
import {
  Box,
  Button,
  Flex,
  Icon,
  IconButton,
  Image,
  Input,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import SideBar from "../components/SideBar";
import {
  FaCommentAlt,
  FaMapMarkerAlt,
  FaRegAddressCard,
  FaTrash,
} from "react-icons/fa";
import { useLocation } from "react-router-dom";

const IcebergDetail = () => {
  const BACKEND_URL = "http://localhost:8080";
  const location = useLocation();
  const { iceberg_id, user_name, is_superuser } = location.state || {};
  const [sideBarOpen, setSideBarOpen] = useState(true);
  const [icebergDetails, setIcebergDetails] = useState<IcebergDetails>({
    area: 0.0,
    mask: "NO_DATA",
    comments: [],
    newComment: "",
    trajectoryImage: "",
  });
  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/iceberg_info/trajectory/${iceberg_id}`, {
        responseType: "arraybuffer",
      })
      .then((response) => {
        const blob = new Blob([response.data], { type: "image/png" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const imageBase64 = reader.result as string;

          setIcebergDetails((prevData) => ({
            ...prevData,
            trajectoryImage: imageBase64,
          }));
        };
        reader.readAsDataURL(blob);
      })
      .catch((error) => console.error(`Error fetching data: ${error}`));
    axios
      .get(`${BACKEND_URL}/iceberg_info/basic/${iceberg_id}`)
      .then((response) => {
        const { area, mask } = response.data;
        setIcebergDetails((prevData) => ({
          ...prevData,
          area: area,
          mask: mask,
        }));
      })
      .catch((error) => console.error("Error fetching data:", error));
    // fetching existing comments
    axios
      .get(`${BACKEND_URL}/iceberg/comments/${iceberg_id}`)
      .then((response) => {
        setIcebergDetails((prevData) => ({
          ...prevData,
          comments: response.data,
        }));
      })
      .catch((error) => console.error(`Error fetching comments: ${error}`));
  }, [iceberg_id]);

  const handleCommentSubmit = () => {
    const curr_time = new Date();
    axios
      .post(`${BACKEND_URL}/iceberg/comments`, {
        iceberg_id: iceberg_id,
        suggestion: icebergDetails.newComment,
        user_name: user_name,
        suggestion_time: curr_time.toISOString(),
      })
      .then((response) => {
        setIcebergDetails((prevData) => ({
          ...prevData,
          comments: [
            ...icebergDetails.comments,
            {
              comment_id: response.data.comment_id,
              suggestion: icebergDetails.newComment,
              user_name: user_name,
              suggestion_time: curr_time.toISOString(),
            },
          ],
          newComment: "",
        }));
      })
      .catch((error) => console.error("Error submitting comment:", error));
  };

  const handleCommentDeletion = (comment_id: number) => {
    axios
      .delete(`${BACKEND_URL}/iceberg/comments/${comment_id}`)
      .then(() => {
        setIcebergDetails((prevData) => ({
          ...prevData,
          comments: prevData.comments.filter(
            (comment) => comment.comment_id !== comment_id
          ),
        }));
      })
      .catch((error) => {
        console.error("Error deleting comment: ", error);
      });
  };

  const setNewComment = (newComment: string) => {
    setIcebergDetails((prevData) => ({
      ...prevData,
      newComment: newComment,
    }));
  };

  return (
    <Flex height="100vh">
      <Box
        width="220px"
        bg="blue.800"
        color="white"
        p="4"
        position="fixed"
        height="100vh"
        top="0"
      >
        <SideBar
          username={user_name}
          is_superuser={is_superuser}
          isOpen={sideBarOpen}
          onToggle={() => setSideBarOpen(!sideBarOpen)}
          onNavigate={() => setSideBarOpen(false)}
        />
      </Box>
      <Box ml="220px" p="6" w="full" bg="gray.50" minHeight="100vh">
        <VStack spacing={8} align="center">
          <Box width="full" maxW="800px">
            <Image
              src={icebergDetails.trajectoryImage}
              alt="Iceberg Trajectory"
              objectFit="contain"
              maxHeight="500px"
              width="100%"
              borderRadius="md"
              boxShadow="lg"
            />
          </Box>
          {/* Iceberg Info */}
          <Box
            bg="white"
            p="6"
            rounded="lg"
            boxShadow="md"
            width="full"
            maxWidth="800px"
            textAlign="center"
          >
            <Text fontSize="2xl" fontWeight="bold" color="blue.800" mb={4}>
              Iceberg Information
            </Text>
            <Flex justify="center" align="center" mb={2}>
              <Icon as={FaMapMarkerAlt} boxSize={6} color="blue.500" mr={3} />
              <Text fontSize="lg" fontWeight="bold" color="gray.600" mt={3}>
                Area: {icebergDetails.area} square kilometers
              </Text>
            </Flex>
            <Flex justify="center" align="center">
              <Icon as={FaRegAddressCard} boxSize={6} color="blue.500" mr={3} />
              <Text fontSize="lg" fontWeight="bold" color="gray.600" mt={3}>
                Surrounding: {icebergDetails.mask}
              </Text>
            </Flex>
          </Box>

          {/* Comments Section */}
          <Box
            bg="white"
            p="6"
            rounded="lg"
            boxShadow="md"
            width="full"
            maxWidth="800px"
            textAlign="left"
            mt={8}
          >
            <Text fontSize="xl" fontWeight="bold" mb={4} color="blue.800">
              <Icon as={FaCommentAlt} boxSize={6} color="blue.500" mr={3} />
              Comments
            </Text>
            <Box
              maxHeight="300px"
              overflowY="auto"
              mb={4}
              borderBottom="2px solid"
              borderColor="gray.200"
              pb={4}
            >
              {icebergDetails.comments.slice(0, 5).map((comment, idx) => (
                <Flex
                  key={idx}
                  align="start"
                  mb={4}
                  justifyContent="space-between"
                >
                  <Text fontSize="md" color="gray.700">
                    <Icon
                      as={FaCommentAlt}
                      boxSize={6}
                      color="blue.500"
                      mr={3}
                    />
                    <strong>{comment.user_name}:</strong>{" "}
                    {comment.suggestion_time.split("T")[0]} {comment.suggestion}
                  </Text>
                  {is_superuser && (
                    <IconButton
                      icon={<FaTrash />}
                      colorScheme="red"
                      aria-label="delete"
                      boxSize={6}
                      onClick={() => handleCommentDeletion(comment.comment_id)}
                    />
                  )}
                </Flex>
              ))}
            </Box>

            <Stack spacing={4}>
              <Input
                placeholder="Add a comment..."
                value={icebergDetails.newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) =>
                  e.key == "Enter" &&
                  icebergDetails.newComment &&
                  handleCommentSubmit()
                }
                size="lg"
                borderColor="gray.300"
              />
              <Button
                onClick={handleCommentSubmit}
                colorScheme="blue"
                size="lg"
                width="full"
                isDisabled={!icebergDetails.newComment.trim()}
                leftIcon={<Icon as={FaCommentAlt} boxSize={4} />}
              >
                Submit Comment
              </Button>
            </Stack>
          </Box>
        </VStack>
      </Box>
    </Flex>
  );
};

export default IcebergDetail;
