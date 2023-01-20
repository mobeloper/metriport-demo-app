import { Box, VStack } from "@chakra-ui/react";
import Iframe from "react-iframe";


export default function Device({}: {}) {


  return (
    <Box>
      <VStack align="stretch">
        <Iframe
          url="http://localhost:5500/"
          id="connect-widget"
          height="800px"
          width="80%"
        />
      </VStack>
    </Box>
  );
}
