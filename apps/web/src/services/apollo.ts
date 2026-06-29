import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'
import { SetContextLink } from '@apollo/client/link/context'

// URI do endpoint GraphQL — composta a partir de VITE_API_URL
const uri = `${import.meta.env.VITE_API_URL}/graphql`

// Injeta o header Authorization com Bearer token lido do localStorage
const authLink = new SetContextLink((prevContext) => {
  const token = localStorage.getItem('accessToken')

  return {
    headers: {
      ...prevContext.headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  }
})

const httpLink = new HttpLink({ uri })

// Cliente Apollo compartilhado — authLink encadeado antes do httpLink
export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
})
