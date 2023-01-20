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

export default function Sleep({}: {}) {
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [isLoadingSleep, setIsLoadingSleep] = useState(false);
  const [sleepData, setSleepData] = useState({});
  const color = useColorModeValue('white', 'gray.700');

  class SleepFormValues {
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

  // gets user sleep data for the specified day
  async function getSleepData(date: string) {
    setIsLoadingSleep(true);
    const resp = await api.get('/sleep', { params: { date } });
    setIsLoadingSleep(false);
    setSleepData(resp.data);
  }

  return (
    <Box>
      {isLoadingToken ? (
        <Spinner size={'xl'}></Spinner>
      ) : (
        <VStack pt={4} align='stretch'>
          <Heading>Example GET /sleep</Heading>
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
              initialValues={new SleepFormValues()}
              validate={values => {
                const errors = {} as SleepFormValues;
                if (!values.date) {
                  errors.date = 'Required';
                }
                return errors;
              }}
              onSubmit={async (values, { setSubmitting }) => {
                setSubmitting(true);
                await getSleepData(values.date);
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
          <Code>{JSON.stringify(sleepData, null, 2)}</Code>
        </VStack>
      )}
    </Box>
  );
}
