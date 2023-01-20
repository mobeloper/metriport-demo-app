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

export default function Biometrics({}: {}) {
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [isLoadingBiometrics, setIsLoadingBiometrics] = useState(false);
  const [biometricsData, setBiometricsData] = useState({});
  const color = useColorModeValue('white', 'gray.700');

  class BiometricsFormValues {
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

  // gets user biometrics data for the specified day
  async function getBiometricsData(date: string) {
    setIsLoadingBiometrics(true);
    const resp = await api.get('/biometrics', { params: { date } });
    setIsLoadingBiometrics(false);
    setBiometricsData(resp.data);
  }

  return (
    <Box>
      {isLoadingToken ? (
        <Spinner size={'xl'}></Spinner>
      ) : (
        <VStack pt={4} align='stretch'>
          <Heading>Example GET /biometrics</Heading>
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
              initialValues={new BiometricsFormValues()}
              validate={values => {
                const errors = {} as BiometricsFormValues;
                if (!values.date) {
                  errors.date = 'Required';
                }
                return errors;
              }}
              onSubmit={async (values, { setSubmitting }) => {
                setSubmitting(true);
                await getBiometricsData(values.date);
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
          <Code>{JSON.stringify(biometricsData, null, 2)}</Code>
        </VStack>
      )}
    </Box>
  );
}
