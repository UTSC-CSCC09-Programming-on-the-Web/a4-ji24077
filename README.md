# Web Gallery: Managing Users

## Live Demo

🌐 **Application URL**: https://jiwebgallery.website

> You can test all features in the live deployed application.

The objective of these assignments is to build an application called _The Web Gallery_ where users can share pictures and comments. This application is similar to existing web applications such as Facebook, Instagram or Google Photos.

In this last assignment, you will concentrate on user authentication, and authorization.

## Instructions

> [!CAUTION]
> Github Copilot may be used in this assignment. However, if you decide to use prompt engineering to generate code using Github Copilot Chat, you must CLEARLY indicate the prompt you used and the generated code in the comments directly preceeding the code. No other AI tool is allowed.

For this assignment, you should use the packages that were introduced in the labs. No other packages are allowed unless explicitly mentioned otherwise.

Make sure that all of these required packages are recorded in the `package.json` file. When the TA is marking your assignment, they will clone your repository into a new directory and run `npm install` to install all the packages. If your code does not work in this way, you will receive a **0**.

> [!IMPORTANT]
> A `.github/workflows/express.yml` file is provided to help you sanity check that the server can be run on a fresh install. At least ensure that the CI passes before submitting your assignment.

### Code quality and organization

All of your work should be well organized. This directory should be organized as follows:

- `app.js`: the app entrypoint
- `static/`: your frontend developed for assignment 1 (HTML, CSS, Javascript and UI media files)
- `routers/`: the routers for the different resources
- `models/`: the models for the different resources
- `package.json` and `package-lock.json`: the Node.js package file
- `uploads/`: the uploaded files
- `.gitignore`: list of files that should not be committed to github

Your code must be of good quality and follow all guidelines given during lectures, labs, and the previous assignment. Remember, any code found online and improperly credited can constitute an academic violation.

### Submission

You should submit your work to your Github course repository and Gradescope.

Before submitting your final version. It is strongly recommended verifying that your code is portable. To do so:

- push your work to Github
- clone it into a new directory
- install all packages with the single command `npm install` that will install all packages found in the `package.json` file
- start the app with the command `node app.js`

> [!WARNING]
> As mentioned in the first lecture, if your code does not work like the above, you will automatically receive a **0**.

## Multiple Galleries and Multiple Users

In this part, you are going to extend your API to support authenticated users and multiple galleries. Each user will now have his/her own gallery. All previous rules for 1 gallery applies.

## Authentication (up to 25 points)

Users should be able to sign-up, sign-in and sign-out and no longer need to enter a username when adding images and comments.

You may choose to implement authentication using only 1 of the following approaches:

- Session cookies approach as shown in lab (max 20 points)
- Access token / Bearer token approach (max 25 points)

You will be graded on the security of your authentication implementation.

## Authorization Policies (25 points)

You must implement the following authorization policies:

- Unauthenticated users can view all galleries, but cannot view any comments
- Authenticated users can sign-out of the application
- Authenticated users can browse any gallery and its comments
- Gallery owners can upload and delete pictures to their own gallery only
- Authenticated users can post comments on any picture of any gallery
- Authenticated users can delete any one of their own comments but not others
- Gallery owners can delete any comment on any picture from their own gallery

While refactoring your application, you should redesign your REST API to reflect the fact that image galleries are owned by users.

## Frontend SPA Update (up to 20 points)

This part of the assignment builds on top of what you have already built for assignment 2.
Update your current frontend to reflect all changes made above. The homepage should now a paginated list of all galleries that can be browsed.

You may choose to:

- Create separate HTML pages for `index.html`, `login.html`, and `credits.html` (max 15 points)
- Create a true single page application (SPA) with javascript loading all pages. (max 20 points)

> [!NOTE]
> If the user does not have access to an action, the action buttons should be hidden or disabled
> accordingly.

## Syllabus

- Feature for multiple galleries [20pts]
- Authentication & Code Quality [20pts]
- Authorization & Code Quality [30pts]
- Frontend SPA Update [20pts]
- Repository quality and organization [10pts]

Total: 100pts
