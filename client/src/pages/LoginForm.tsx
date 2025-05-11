import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useState } from "react";
import { login } from "../hooks/useAuth";
import { isAxiosError } from "axios";
import logo from "../assets/iceberg_database.svg";
import { useNavigate, Link } from "react-router-dom";
import {
  Container,
  FormControl,
  FormErrorMessage,
  Image,
  Input,
  Button,
  Text,
  Icon,
  InputRightElement,
  useBoolean,
  Flex,
  InputGroup,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { Message, UserLogin } from "../types/types";
import { Toast, ToastContainer } from "react-bootstrap";
import { useUser } from "../hooks/useUser";

const LoginForm = () => {
  const navigate = useNavigate();
  const [show, setShow] = useBoolean();
  const { setUser } = useUser(); // user state from global context
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState<Message>({
    message: "",
    msgVariant: "success",
    msgVisible: false,
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserLogin>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: UserLogin) => {
    const { username, password } = data;
    try {
      const response = await login(username, password);
      const user_token = response.data.access_token;
      const is_superuser = response.data.is_superuser;
      console.log(`user access token: ${user_token}`); // ! for debugging only
      setToken(user_token);
      setMessage({
        message: `${username}, welcome back!`,
        msgVariant: "success",
        msgVisible: true,
      });
      localStorage.setItem("access_token", user_token);
      setUser({
        username: username,
        is_superuser: is_superuser,
        is_signedIn: true,
      });
    } catch (error) {
      if (isAxiosError(error)) {
        if (401 == error.response?.status) {
          setMessage({
            message: error.response?.data.msg,
            msgVariant: "danger",
            msgVisible: true,
          });
        }
      } else {
        setMessage({
          message: `Internal error: ${error}`,
          msgVariant: "danger",
          msgVisible: true,
        });
      }
    }
  };
  const handleInfoClose = () => {
    setMessage((prevMessage) => ({
      ...prevMessage,
      msgVisible: false,
    }));
    if ("success" === message.msgVariant && token) {
      navigate("/");
    }
  };

  return (
    <>
      <Flex flexDir={{ base: "column", md: "row" }} justify="center" h="100vh">
        <Container
          as="form"
          onSubmit={handleSubmit(onSubmit)}
          h="100vh"
          maxW="sm"
          alignItems="stretch"
          justifyContent="center"
          gap={4}
          centerContent
        >
          <Image
            src={logo}
            alt="Iceberg Database"
            height="auto"
            maxW="2xs"
            alignSelf="center"
            mb={4}
          />
          <FormControl id="username" isInvalid={!!errors.username}>
            <Input
              id="username"
              minLength={3}
              {...register("username", { required: "User Name is required" })}
              placeholder="User Name"
              type="text"
            />
            {errors.username && (
              <FormErrorMessage>{errors.username.message}</FormErrorMessage>
            )}
          </FormControl>
          <FormControl id="password" isInvalid={!!errors.password}>
            <InputGroup>
              <Input
                {...register("password", {
                  required: "Password is required",
                })}
                type={show ? "text" : "password"}
                placeholder="Password"
                required
              />
              <InputRightElement
                color="ui.dim"
                _hover={{
                  cursor: "pointer",
                }}
              >
                <Icon
                  as={show ? ViewOffIcon : ViewIcon}
                  onClick={setShow.toggle}
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <ViewOffIcon /> : <ViewIcon />}
                </Icon>
              </InputRightElement>
            </InputGroup>
          </FormControl>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            Log In
          </Button>
          <Text>
            Don't have an account?{" "}
            <Link
              to="/signup"
              style={{ color: "blue", textDecoration: "underline" }}
            >
              Sign up
            </Link>
          </Text>
        </Container>
      </Flex>
      <ToastContainer position="top-center" className="text-center">
        <Toast
          onClose={handleInfoClose}
          show={message.msgVisible}
          bg={message.msgVariant}
          delay={1500}
          autohide
        >
          <Toast.Body className="text-white">{message.message}</Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default LoginForm;
