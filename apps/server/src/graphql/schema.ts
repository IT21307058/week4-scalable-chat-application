import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type User {
    id: String!
    email: String!
    name: String
    createdAt: String!
  }

  type MessageStats {
    totalCount: Int!
    messages: [Message!]!
  }

  type Message {
    id: String!
    text: String!
    userId: String!
    createdAt: String!
  }

  type TodayMessageCountResult {
    user: User
    messageCount: Int!
    messages: [Message!]!
  }

  type Query {
    todayMessageCount: TodayMessageCountResult!
    allMessages: [Message!]!
  }
`;
