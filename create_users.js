import fetch from "node-fetch";

const API_BASE_URL = "http://localhost:3000/api";

const users = [
  { username: "alice", password: "password123" },
  { username: "bob", password: "password123" },
  { username: "charlie", password: "password123" },
  { username: "diana", password: "password123" },
  { username: "edward", password: "password123" },
  { username: "fiona", password: "password123" },
  { username: "george", password: "password123" },
  { username: "helen", password: "password123" },
  { username: "ivan", password: "password123" },
  { username: "julia", password: "password123" },
];

async function createUsers() {
  console.log("Creating 10 users...");

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: user.username,
          password: user.password,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Created user: ${user.username}`);
      } else {
        const error = await response.json();
        console.log(`❌ Failed to create user ${user.username}: ${error.error}`);
      }
    } catch (error) {
      console.log(`❌ Error creating user ${user.username}: ${error.message}`);
    }
  }

  console.log("\nUser creation completed!");
  console.log("\nCreated users:");
  users.forEach((user) => {
    console.log(`- Username: ${user.username}, Password: ${user.password}`);
  });
}

createUsers();
