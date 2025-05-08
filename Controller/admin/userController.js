import { Validator } from "node-input-validator";
import AdminUser from "../../models/admin/AdminUser.js";
import RoleManagement from "../../models/admin/Roles.js";
import UserLoggedFormation from "../../models/admin/userLoggedFormation.js";
import helper from "../../helpers/helper.js";
import jwt from "jsonwebtoken";
import requestIp from "request-ip";
import AdminToken from "../../models/admin/adminToken.js";
import constants from "../../config/constants.js";
import { Parser } from "json2csv";
import axios from "axios";
import fs from "fs";
import path from "path";
import dayjs from "dayjs";

const userController = {
  createUser: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        fullName: "required|string",
        email: "required|email",
        userName: "required|string",
        password: "required|string|minLength:6",
        roleId: "required|string",
      });

      if (!(await v.check())) {
        return helper.error(res, v.errors);
      }

      const existingUser = await AdminUser.findOne({
        userName: req.body.userName,
      });
      if (existingUser) {
        return helper.error(res, "This userName is already in use");
      }

      req.body.password = await helper.passwordEncrypt(req.body.password);

      const role = await RoleManagement.findById(req.body.roleId);
      if (role) {
        req.body.roleType = role.roleType;
      }

      const newUser = await AdminUser.create(req.body);
      return helper.success(res, "User Created Successfully.", newUser);
    } catch (error) {
      return helper.error(res, error.message);
    }
  },

  login: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        username: "required|string",
        password: "required|string",
      });

      if (!(await v.check())) {
        return helper.error(res, v.errors);
      }

      const user = await AdminUser.findOne({
        userName: req.body.username,
      }).select("+password");
      if (!user) {
        return helper.error(res, "User not found");
      }

      const passwordMatch = await helper.comparePass(
        req.body.password,
        user.password
      );
      if (!passwordMatch) {
        return helper.error(res, "Incorrect password");
      }


      const clientIp = requestIp.getClientIp(req);
      const tokenPayload = {
        _id: user._id,
        roleId: user.roleId,
        roleType: user.roleType,
        userName: user.userName,
      };

      // const token = jwt.sign(tokenPayload, constants.JWTSecret, {
      //   expiresIn: "1d",
      // });

      // Create a JWT token
      const token = jwt.sign(tokenPayload, constants.JWTSecret, {
        expiresIn: constants.JWTExpiresIn,
      });

      const tokenData = {
        userId: user._id,
        token,
        expiresAt: new Date(
          Date.now() + helper.parseExpiresIn(constants.JWTExpiresIn)
        ),
      };

      // Save token data in the database
      await AdminToken.create(tokenData);

      await UserLoggedFormation.create({
        userId: user._id,
        ipAddress: clientIp,
        loginTime: new Date(),
      });

      //userId



      return helper.success(res, "Login successful", {
        authToken:token,
        user,
      });
    } catch (error) {
      return helper.error(res, error.message);
    }
  },

  fetchWixPosts1: async (req, res) => {
    try {
      // Prepare data for the API request
      const { limit = 40, offset = 0 } = req.body; // Default to 40 and 0 if not provided

      const data = JSON.stringify({
        query: {
          filter: {
            language: "en",
            $and: [
              {
                lastPublishedDate: {
                  $gte: "2025-01-01T18:30:00.000Z",
                },
              },
              {
                lastPublishedDate: {
                  $lte: "2025-05-05T18:29:59.999Z",
                },
              },
            ],
          },
          sort: [],
          paging: {
            limit, // Use the value from the request body
            offset, // Use the value from the request body
          },
        },
        fieldsets: ["METRICS", "URL", "TRANSLATIONS"],
      });

      // Axios request configuration
      const config = {
        method: "post",
        maxBodyLength: Infinity,
        url: "https://manage.wix.com/_api/communities-blog-node-api/v3/posts/query",
        headers: {
          authorization:
            "R2NP7hpV-bqM8xIbayfmdsVloRlVq39s8VdIItaTwbA.eyJpbnN0YW5jZUlkIjoiNzcwZTkyMjgtNjk1NS00YjBlLTgwY2YtOTBkM2VhNjJlYjhlIiwiYXBwRGVmSWQiOiIxNGJjZGVkNy0wMDY2LTdjMzUtMTRkNy00NjZjYjNmMDkxMDMiLCJtZXRhU2l0ZUlkIjoiYjQ3M2JhMDYtMWY2Ni00NGY0LTk2ODQtODZmY2Y3OWFhY2EzIiwic2lnbkRhdGUiOiIyMDI1LTA1LTA3VDEwOjA2OjE3LjI1OVoiLCJ1aWQiOiJmNTQzMWM0MS1kZTEwLTQyMTItYjhjNC0yNTEwZTM2MDM0ZmIiLCJwZXJtaXNzaW9ucyI6Ik9XTkVSIiwiZGVtb01vZGUiOmZhbHNlLCJiaVRva2VuIjoiYzM3ZDI4MmUtNzYzMy0wZmZhLTE2NGItMTYyZjFkZjg0NzJkIiwic2l0ZU93bmVySWQiOiI4MmNhMDRjYS1jYmVkLTRiN2ItODY3OS1iYjExYzFmZTZkNmYiLCJzaXRlTWVtYmVySWQiOiJhMDAwMzU4Mi0yZGMyLTQyNTgtYjU1ZS01NmYxZTg1YjM1YWEiLCJleHBpcmF0aW9uRGF0ZSI6IjIwMjUtMDUtMDdUMTQ6MDY6MTcuMjU5WiIsImxvZ2luQWNjb3VudElkIjoiZjU0MzFjNDEtZGUxMC00MjEyLWI4YzQtMjUxMGUzNjAzNGZiIiwibHBhaSI6bnVsbCwiYW9yIjp0cnVlLCJzY2QiOiIyMDIxLTAxLTE3VDIzOjI3OjM4LjI0NFoiLCJhY2QiOiIyMDI0LTEwLTMwVDE3OjQ0OjEzWiJ9",
          "X-XSRF-TOKEN":
            "R2NP7hpV-bqM8xIbayfmdsVloRlVq39s8VdIItaTwbA.eyJpbnN0YW5jZUlkIjoiNzcwZTkyMjgtNjk1NS00YjBlLTgwY2YtOTBkM2VhNjJlYjhlIiwiYXBwRGVmSWQiOiIxNGJjZGVkNy0wMDY2LTdjMzUtMTRkNy00NjZjYjNmMDkxMDMiLCJtZXRhU2l0ZUlkIjoiYjQ3M2JhMDYtMWY2Ni00NGY0LTk2ODQtODZmY2Y3OWFhY2EzIiwic2lnbkRhdGUiOiIyMDI1LTA1LTA3VDEwOjA2OjE3LjI1OVoiLCJ1aWQiOiJmNTQzMWM0MS1kZTEwLTQyMTItYjhjNC0yNTEwZTM2MDM0ZmIiLCJwZXJtaXNzaW9ucyI6Ik9XTkVSIiwiZGVtb01vZGUiOmZhbHNlLCJiaVRva2VuIjoiYzM3ZDI4MmUtNzYzMy0wZmZhLTE2NGItMTYyZjFkZjg0NzJkIiwic2l0ZU93bmVySWQiOiI4MmNhMDRjYS1jYmVkLTRiN2ItODY3OS1iYjExYzFmZTZkNmYiLCJzaXRlTWVtYmVySWQiOiJhMDAwMzU4Mi0yZGMyLTQyNTgtYjU1ZS01NmYxZTg1YjM1YWEiLCJleHBpcmF0aW9uRGF0ZSI6IjIwMjUtMDUtMDdUMTQ6MDY6MTcuMjU5WiIsImxvZ2luQWNjb3VudElkIjoiZjU0MzFjNDEtZGUxMC00MjEyLWI4YzQtMjUxMGUzNjAzNGZiIiwibHBhaSI6bnVsbCwiYW9yIjp0cnVlLCJzY2QiOiIyMDIxLTAxLTE3VDIzOjI3OjM4LjI0NFoiLCJhY2QiOiIyMDI0LTEwLTMwVDE3OjQ0OjEzWiJ9",
          "Content-Type": "application/json",
          Cookie: "XSRF-TOKEN=1746614101|IOkaR7uos9FI",
        },
        data: data,
      };

      // Make the axios request
      const response = await axios.request(config);

      // Send the response back to the client
      return res.status(200).json(response.data);
    } catch (error) {
      // Handle any errors that occur during the request
      return res.status(500).json({ error: error.message });
    }
  },

  fetchWixPosts: async (req, res) => {
    try {
      const { limit = 40, offset = 0 } = req.body;
  
      const requestData = {
        query: {
          filter: {
            language: "en",
            $and: [
              {
                lastPublishedDate: {
                  $gte: "2025-01-01T18:30:00.000Z",
                },
              },
              {
                lastPublishedDate: {
                  $lte: "2025-05-05T18:29:59.999Z",
                },
              },
            ],
          },
          sort: [],
          paging: { limit, offset },
        },
        fieldsets: ["METRICS", "URL", "TRANSLATIONS"],
      };
  
      const config = {
        method: "post",
        url: "https://manage.wix.com/_api/communities-blog-node-api/v3/posts/query",
        headers: {
          authorization: "YOUR_TOKEN_HERE",
          "X-XSRF-TOKEN": "YOUR_TOKEN_HERE",
          "Content-Type": "application/json",
          Cookie: "XSRF-TOKEN=YOUR_COOKIE_HERE",
        },
        data: JSON.stringify(requestData),
      };
  
      const { data } = await axios(config);
  
      const formattedData = data.posts.map((post) => ({
        ID: "",
        Title: post.title,
        Content: post.content?.replace(/\n/g, " ") || "",
        Excerpt: post.excerpt || "",
        Date: dayjs(post.lastPublishedDate).format("YYYY-MM-DD HH:mm:ss"),
        "Post Type": "post",
        Permalink: post.slug,
        "Image URL": post.media?.wixMedia?.image?.url || "",
        "Image Title": "",
        "Image Caption": "",
        "Image Description": "",
        "Image Alt Text": "",
        "Image Featured": "1",
        "Attachment URL": post.media?.wixMedia?.image?.url || "",
        Categories: post.category?.join(",") || "",
        Tags: post.tags?.join(",") || "",
        Status: post.status || "draft",
        "Author ID": "1",
        "Author Username": "admin",
        "Author Email": "admin@example.com",
        "Author First Name": "Admin",
        "Author Last Name": "",
        Slug: post.slug,
        Format: "standard",
        Template: "",
        Parent: "",
        "Parent Slug": "",
        Order: "0",
        "Comment Status": post.allowComments ? "open" : "closed",
        "Ping Status": "open",
        "Post Modified Date": dayjs(post.lastPublishedDate).format("YYYY-MM-DD HH:mm:ss"),
      }));
  
      const fields = [
        "ID",
        "Title",
        "Content",
        "Excerpt",
        "Date",
        "Post Type",
        "Permalink",
        "Image URL",
        "Image Title",
        "Image Caption",
        "Image Description",
        "Image Alt Text",
        "Image Featured",
        "Attachment URL",
        "Categories",
        "Tags",
        "Status",
        "Author ID",
        "Author Username",
        "Author Email",
        "Author First Name",
        "Author Last Name",
        "Slug",
        "Format",
        "Template",
        "Parent",
        "Parent Slug",
        "Order",
        "Comment Status",
        "Ping Status",
        "Post Modified Date"
      ];
  
      const parser = new Parser({ fields });
      const csv = parser.parse(formattedData);
  
      const outputPath = `D:/exports/wix_posts_limit-${limit}_offset-${offset}.csv`;
      fs.writeFileSync(outputPath, csv);
  
      return res
        .status(200)
        .json({ message: "CSV exported successfully.", path: outputPath });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
};

export default userController;


const cleanText = (text) => {
  return he
    .decode(text || "")
    .replace(/\n/g, " ")
    .replace(/[^\x20-\x7E]+/g, "") // remove non-ASCII chars
    .trim();
};