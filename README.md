# Running and Deploying T2G Blog

## Running Locally

### Frontend

1. Navigate to the root folder of the project:

    ```bash
    cd path/to/your/project
    ```

2. Install the required dependencies:

    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    # or
    bun install
    ```

3. Run the Next.js development server:

    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    # or
    bun dev
    ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### Backend

1. Navigate to the `backend` folder:

    ```bash
    cd backend
    ```

2. Install the required dependencies:

    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    # or
    bun install
    ```

3. Run the Express server:

    ```bash
    npm start
    # or
    yarn start
    # or
    pnpm start
    # or
    bun start
    ```

4. The Express server will typically run on [http://localhost:5000](http://localhost:5000), or the port specified in your configuration.

## Deploying to Vercel

To deploy your Next.js frontend and Express backend to Vercel, follow these steps:

1. Push your project to a Git repository (e.g., GitHub, GitLab, Bitbucket).

2. Go to [Vercel](https://vercel.com/) and sign in with your account.

3. Click on the "New Project" button.

4. Import your Git repository by selecting the repository where your project is stored.

5. Vercel will automatically detect your Next.js frontend and configure it for deployment. For the Express backend, you may need to specify a custom deployment configuration if it's not in the root directory.

6. Click "Deploy" and Vercel will build and deploy your application.

7. Once the deployment is complete, you will receive a URL where your application is live.

For more details on configuring deployments and using Vercel, check out the [Vercel Documentation](https://vercel.com/docs).

