import { useState } from "react";
import { signup } from "../hooks/useAuth";
import { isAxiosError } from "axios";
import logo from "../assets/iceberg_database.svg";
import { useNavigate, Link } from "react-router-dom";
import {
  Container,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Image,
  Input,
  Button,
  Text,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { UserRegister } from "../types/types";
import {
  confirmPasswordRules,
  emailPattern,
  passwordRules,
} from "../utils/utils";
import { Toast, ToastContainer } from "react-bootstrap";

interface UserRegisterForm extends UserRegister {
  confirm_password: string;
}

const SignupForm = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [msgVariant, setMsgVariant] = useState("success");
  const [msgVisible, setMsgVisibility] = useState(false);
  const {
    register,
    getValues,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserRegisterForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      email: "",
      username: "",
      password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (data: UserRegisterForm) => {
    const { username, email, password } = data;
    try {
      await signup(username, password, email);
      setMessage(`${username}, welcome to Iceberg Database!`);
      setMsgVariant("success");
    } catch (error) {
      if (isAxiosError(error)) {
        if (409 == error.response?.status) {
          setMessage(error.response.data.msg);
        }
      } else {
        setMessage(`Internal error: ${error}`);
      }
      setMsgVariant("danger");
    } finally {
      setMsgVisibility(true);
    }
  };

  const handleInfoClose = () => {
    setMsgVisibility(false);
    if ("success" === msgVariant) {
      navigate("/login");
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
            <FormLabel htmlFor="username" srOnly>
              User Name
            </FormLabel>
            <Input
              id="username"
              minLength={3}
              {...register("username", { required: "User Name is required" })}
              placeholder="User Name (at least 3 characters)"
              type="text"
            />
            {errors.username && (
              <FormErrorMessage>{errors.username.message}</FormErrorMessage>
            )}
          </FormControl>
          <FormControl id="email" isInvalid={!!errors.email}>
            <FormLabel htmlFor="email" srOnly>
              Email
            </FormLabel>
            <Input
              id="email"
              {...register("email", {
                required: "Email is required",
                pattern: emailPattern,
              })}
              placeholder="Email"
              type="email"
            />
            {errors.email && (
              <FormErrorMessage>{errors.email.message}</FormErrorMessage>
            )}
          </FormControl>
          <FormControl id="password" isInvalid={!!errors.password}>
            <FormLabel htmlFor="password" srOnly>
              Password
            </FormLabel>
            <Input
              id="password"
              {...register("password", passwordRules())}
              placeholder="Password"
              type="password"
            />
            {errors.password && (
              <FormErrorMessage>{errors.password.message}</FormErrorMessage>
            )}
          </FormControl>
          <FormControl
            id="confirm_password"
            isInvalid={!!errors.confirm_password}
          >
            <FormLabel htmlFor="confirm_password" srOnly>
              Confirm Password
            </FormLabel>

            <Input
              id="confirm_password"
              {...register("confirm_password", confirmPasswordRules(getValues))}
              placeholder="Repeat Password"
              type="password"
            />
            {errors.confirm_password && (
              <FormErrorMessage>
                {errors.confirm_password.message}
              </FormErrorMessage>
            )}
          </FormControl>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            Sign Up
          </Button>
          <Text>
            Already have an account?{" "}
            <Link
              to="/login"
              style={{ color: "blue", textDecoration: "underline" }}
            >
              Log In
            </Link>
          </Text>
        </Container>
      </Flex>
      <ToastContainer position="top-center" className="text-center">
        <Toast
          onClose={handleInfoClose}
          show={msgVisible}
          bg={msgVariant}
          delay={1500}
          autohide
        >
          <Toast.Body className="text-white">{message}</Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default SignupForm;
