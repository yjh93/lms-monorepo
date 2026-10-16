import { handlers } from '@lms/api-client/mocks'
import { setupServer } from 'msw/node'

/** 브라우저(dev)와 같은 MSW 핸들러를 Node 테스트에서도 사용한다. */
export const server = setupServer(...handlers)
