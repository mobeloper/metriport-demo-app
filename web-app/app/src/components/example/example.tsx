import {
  Heading,
  Box,
  Spinner,
  VStack,
  Stack,
  FormLabel,
  InputGroup,
  FormErrorMessage,
  FormControl,
  Input,
  Button,
  useColorModeValue,
  Tag,
  Code
} from '@chakra-ui/react';
import { Field, Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import { api } from '../shared/api';
import { fetchUserToken } from '../shared/util';

export default function Example({}: {}) {
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [isLoadingValues, setIsLoadingValues] = useState(false);
  const [isLoadingNutrition, setIsLoadingNutrition] = useState(false);
  const [nutritionData, setNutritionData] = useState({});
  const [prevValues, setPrevValues] = useState<number[]>([]);
  const color = useColorModeValue('white', 'gray.700');

  class FormValues {
    value: string = '';
  }

  class NutritionFormValues {
    date: string = '';
  }

  // ensure user token is loaded into the api
  useEffect(() => {
    fetchUserToken()
      .then(token => {
        setIsLoadingToken(false);
        api.defaults.headers.common['Authorization'] = token;
      })
      .catch(err => console.log(err));
  }, []);

  // submits the value to the backend
  async function submitValue(value: string) {
    await api.post('/example', null, { params: { value } });
  }

  // gets all the previously submitted values from the backend
  async function getPrevValues() {
    setIsLoadingValues(true);
    const resp = await api.get('/example');
    setPrevValues(resp.data.values);
    setIsLoadingValues(false);
  }

  // gets user nutrition data for the specified day
  async function getNutritionData(date: string) {
    setIsLoadingNutrition(true);
    const resp = await api.get('/nutrition', { params: { date } });
    setIsLoadingNutrition(false);
    setNutritionData(resp.data);
  }

  return (
    <Box>
      {isLoadingToken ? (
        <Spinner size={'xl'}></Spinner>
      ) : (
        <VStack pt={4} align='stretch'>
          <Heading>Example POST/GET</Heading>
          <Stack
            spacing={4}
            w={'full'}
            maxW={'md'}
            bg={color}
            rounded={'xl'}
            boxShadow={'lg'}
            p={6}
            my={12}
          >
            <Formik
              initialValues={new FormValues()}
              validate={values => {
                const errors = {} as FormValues;
                if (!values.value) {
                  errors.value = 'Required';
                }
                return errors;
              }}
              onSubmit={async (values, { setSubmitting }) => {
                setSubmitting(true);
                await submitValue(values.value);
                setSubmitting(false);
              }}
            >
              {({ isSubmitting, handleSubmit }) => (
                <Form onSubmit={handleSubmit}>
                  <VStack spacing={5}>
                    <Field name='value'>
                      {({ field, form }: { field: any; form: any }) => (
                        <FormControl
                          isRequired
                          isInvalid={form.errors.value && form.touched.value}
                        >
                          <FormLabel>
                            How are you feeling on a scale of 1 to 10?
                          </FormLabel>
                          <InputGroup>
                            <Input {...field} placeholder='123' />
                          </InputGroup>
                          <FormErrorMessage>
                            {form.errors.value}
                          </FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>

                    <Button
                      colorScheme='blue'
                      bg='#748df0'
                      color='white'
                      _hover={{
                        bg: '#879ced'
                      }}
                      isLoading={isSubmitting}
                      type='submit'
                    >
                      Submit
                    </Button>
                  </VStack>
                </Form>
              )}
            </Formik>
          </Stack>
          <Stack
            spacing={4}
            w={'full'}
            maxW={'md'}
            bg={color}
            rounded={'xl'}
            boxShadow={'lg'}
            p={6}
            my={12}
          >
            <Button
              colorScheme='blue'
              bg='#748df0'
              color='white'
              _hover={{
                bg: '#879ced'
              }}
              isLoading={isLoadingValues}
              onClick={getPrevValues}
            >
              Get Previous Values
            </Button>
            {prevValues.map((val: number) => {
              return <Tag>{val}</Tag>;
            })}
          </Stack>
          <Heading>Example GET /nutrition</Heading>
          <Stack
            spacing={4}
            w={'full'}
            maxW={'md'}
            bg={color}
            rounded={'xl'}
            boxShadow={'lg'}
            p={6}
            my={12}
          >
            <Formik
              initialValues={new NutritionFormValues()}
              validate={values => {
                const errors = {} as NutritionFormValues;
                if (!values.date) {
                  errors.date = 'Required';
                }
                return errors;
              }}
              onSubmit={async (values, { setSubmitting }) => {
                setSubmitting(true);
                await getNutritionData(values.date);
                setSubmitting(false);
              }}
            >
              {({ isSubmitting, handleSubmit }) => (
                <Form onSubmit={handleSubmit}>
                  <VStack spacing={5}>
                    <Field name='date'>
                      {({ field, form }: { field: any; form: any }) => (
                        <FormControl
                          isRequired
                          isInvalid={form.errors.date && form.touched.date}
                        >
                          <FormLabel>Date</FormLabel>
                          <InputGroup>
                            <Input {...field} placeholder='YYYY-MM-DD' />
                          </InputGroup>
                          <FormErrorMessage>
                            {form.errors.date}
                          </FormErrorMessage>
                        </FormControl>
                      )}
                    </Field>

                    <Button
                      colorScheme='blue'
                      bg='#748df0'
                      color='white'
                      _hover={{
                        bg: '#879ced'
                      }}
                      isLoading={isSubmitting}
                      type='submit'
                    >
                      Get Data
                    </Button>
                  </VStack>
                </Form>
              )}
            </Formik>
          </Stack>
          <Code>{JSON.stringify(nutritionData, null, 2)}</Code>
        </VStack>
      )}
    </Box>
  );
}
