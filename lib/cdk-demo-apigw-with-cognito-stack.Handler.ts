import {APIGatewayProxyHandlerV2} from 'aws-lambda';

interface Pet {
  name: string;
  age: number;
}

interface Response {
  pets: Pet[];
}

export const handler: APIGatewayProxyHandlerV2 = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      pets: [
        {
          name: 'hina',
          age: 1,
        },
        {
          name: 'koharu',
          age: 2,
        },
        {
          name: 'konatsu',
          age: 3,
        },
      ],
    } as Response),
  };
};
