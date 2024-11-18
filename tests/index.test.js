import { axios } from "axios";

const BACKEND_URL = "https://localhost:3000";

// AUTHENTICATION SECTION
describe("Authentication", () => {
  // Sign up
  test("User is able to sign up only once", async () => {
    const username = "debayan" + Math.random(); //debayan0.774
    const password = "debayan@12";
    const response = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      type: "admin",
    });
    expect(response.statusCode.toBe(200));
    // Try to send the same cradentials again it should fail
    const updatedResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      type: "admin",
    });

    expect(updatedResponse.statusCode.toBe(400));
  });
  test("Signup request fails if the username is empty", async () => {
    const username = "debayan" + Math.random();
    const password = "debayan@12";

    const response = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      password,
    });

    expect(response.statusCode).toBe(400);
  });
  // TODO: If I will send only the password it should Rejected
  // If the password is really small then it should reject

  // Sign in
  test("Signin succeeds if the username and password are correct", async () => {
    const username = "debayan" + Math.random();
    const password = "debayan@12";
    // make the user sign up at first
    await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
    });
    // Then let them sign in
    const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
      username,
      password,
    });

    expect(response.statusCode).toBe(200);
    // token part, it may be token: "some_random_string" it should be defined
    expect(response.body.token).toBeDefined();
  });

  test("Signin fails if the username and password are incorrect", async () => {
    const username = `debayan-${Math.random()}`;
    const password = "debayan@12";

    // sign up at first
    await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
    });
    const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
      username: "WrongUsername",
      password,
    });

    expect(response.statusCode).toBe(403);
  });
});

// USER INFORMATION SECTION
describe("User metadata endpoints", () => {
  let token = "";
  let avatarId = "";
  // whatever code is in beforeAll will run before all of the tests run
  beforeAll(async () => {
    // people have to sign in before using this route
    const username = `debayan-${Math.random()}`;
    const password = "debayan@12";
    await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      type: "admin",
    });

    await axios.post(`${BACKEND_URL}/api/v1/signin`, {
      username,
      password,
    });
    token = response.data.token;

    // create an avatar: ONLY ADMIN CAN CREATE AN AVATAR
    const avatarResponse = await axios.post(`${BACKEND_URL}/api/v1/avatar`, {
      imageUrl:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
      name: "Timmy",
    });
    avatarId = avatarResponse.data.avatarId;
  });
  test("User can't update their metadata woth a wrong avatar id", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/user/metadata`,
      {
        avatarId: "47474",
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    );
    expect(response.statusCode).toBe(400);
  });
  test("User can update their metadata with a right avatar id", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/user/metadata`,
      {
        avatarId,
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    );
    expect(response.statusCode).toBe(200);
  });
  test("User is not able to update their metatdata if the auth header is not present", async () => {
    const response = await axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
      avatarId,
    });
    expect(response.statusCode).toBe(403);
  });
});

describe("User avatar information", () => {
  let avatarId;
  let token;
  let userId;
  beforeAll(async () => {
    // people have to sign in before using this route
    const username = `debayan-${Math.random()}`;
    const password = "debayan@12";
    const signUpResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      type: "admin",
    });

    userId = signUpResponse.data.userId;

    await axios.post(`${BACKEND_URL}/api/v1/signin`, {
      username,
      password,
    });
    token = response.data.token;

    // create an avatar: ONLY ADMIN CAN CREATE AN AVATAR
    const avatarResponse = await axios.post(`${BACKEND_URL}/api/v1/avatar`, {
      imageUrl:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
      name: "Timmy",
    });
    avatarId = avatarResponse.data.avatarId;
  });

  test("Get back avatar information for a user", async () => {
    const response = axios.get(
      `${BACKEND_URL}/api/v1/user/metadata/bulk?ids=[${userId}]`,
    );
    expect(response.data.avatars.length).toBe(1);
    expect(response.data.avatars[0].userId).toBe(userId);
  });
  test("Available avatars lists the recently created avatars", async () => {
    const response = await axios.get(`${BACKEND_URL}/api/v1/avatars`);
    expect(response.data.length).not.toBe(0);
    const currentAvatar = response.data.avatars.find((x) => x.id == avatarId);
    expect(currentAvatar).toBeDefined();
  });
});

describe("Space information", () => {
  let mapId;
  let element1Id;
  let element2Id;
  let token;
  let adminId;
  let adminToken;
  let userId;
  let userToken;
  beforeAll(async () => {
    const username = `debayan-${Math.random()}`;
    const password = "debayan@12";
    // for the admin
    const signUpResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      type: "admin",
    });
    adminId = signUpResponse.data.userId;

    const signInResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
      username,
      password,
    });
    adminToken = signInResponse.data.token;

    // for the user
    const usersignUpResponse = await axios.post(
      `${BACKEND_URL}/api/v1/signup`,
      {
        username,
        password,
        type: "user",
      },
    );

    userId = usersignUpResponse.data.userId;
    const usersignInResponse = await axios.post(
      `${BACKEND_URL}/api/v1/signin`,
      {
        username,
        password,
      },
    );
    userToken = usersignInResponse.data.token;

    const element1 = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        width: 1,
        height: 1,
        static: true,
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      },
    );
    const element2 = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        width: 1,
        height: 1,
        static: true,
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    );
    element1Id = element1.id;
    element2Id = element2.id;
    const map = await axios.post(
      `${BACKEND_URL}/api/v1/admin/map`,
      {
        thumbnail: "https://thumbnail.com/a.png",
        dimensions: "100x200",
        name: "100 person interview room",
        defaultElements: [
          {
            elementId: element1Id,
            x: 20,
            y: 20,
          },
          {
            elementId: element1Id,
            x: 18,
            y: 20,
          },
          {
            elementId: element2Id,
            x: 19,
            y: 20,
          },
        ],
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      },
    );
    mapId = map.id;
  });
  test("User is able to create a space", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/space`,
      {
        name: "Test",
        dimensions: "100x200",
        mapId: mapId,
      },
      {
        header: {
          authorization: `Bearer ${userToken}`,
        },
      },
    );
    expect(response.spaceId).toBeDefined();
  });
  test("User is able to create a space without a map Id (empty space)", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/space`,
      {
        name: "Test",
        dimensions: "100x200",
      },
      {
        header: {
          authorization: `Bearer ${userToken}`,
        },
      },
    );
    expect(response.spaceId).toBeDefined();
  });
  test("User is not able to create a space without mapId and dimensions", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/space`,
      {
        name: "Test",
      },
      {
        header: {
          authorization: `Bearer ${userToken}`,
        },
      },
    );
    expect(response.statusCode).toBe(400);
  });
  test("User is not able to delete a space that doesn't exist", async () => {
    const response = await axios.delete(
      `${BACKEND_URL}/api/v1/space/randomIdDoesNotExist`,
    );
    expect(response.statusCode).toBe(400);
  });
  test("User is able to delete a space that does exist", async () => {
    // create a space
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/space`,
      {
        name: "Test",
        dimensions: "100x200",
      },
      {
        header: {
          authorization: `Bearer ${userToken}`,
        },
      },
    );
    const deleteResponse = await axios.delete(
      `${BACKEND_URL}/api/v1/space/${response.data.spaceId}`,
      {
        header: {
          authorization: `Bearer ${userToken}`,
        },
      },
    );
    expect(deleteResponse.statusCode).toBe(200);
  });
  test("User should not be able to delete a space created by other user", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/space`,
      {
        name: "Test",
        dimensions: "100x200",
      },
      {
        header: {
          authorization: `Bearer ${userToken}`,
        },
      },
    );
    const deleteResponse = await axios.delete(
      `${BACKEND_URL}/api/v1/space/${response.data.spaceId}`,
      {
        header: {
          authorization: `Bearer ${adminToken}`,
        },
      },
    );
    expect(deleteResponse.statusCode).toBe(400);
  });
  test("Admins have no spaces initially", async () => {
    const response = await axios.get(`${BACKEND_URL}/api/v1/space/all`);
    expect(response.data.spaces.length).toBe(0);
  });
});
