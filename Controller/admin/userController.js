import { Validator } from 'node-input-validator';
import AdminUser from '../../models/admin/AdminUser.js';
import RoleManagement from '../../models/admin/Roles.js';
import UserLoggedFormation from '../../models/admin/userLoggedFormation.js';
import helper from '../../helpers/helper.js';
import jwt from 'jsonwebtoken';
import requestIp from 'request-ip';
import AdminToken from '../../models/admin/adminToken.js';
import constants from '../../config/constants.js';
import { Parser } from 'json2csv';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import dayjs from 'dayjs';
import { exit } from 'process';

const userController = {
  createUser: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        fullName: 'required|string',
        email: 'required|email',
        userName: 'required|string',
        password: 'required|string|minLength:6',
        roleId: 'required|string',
      });

      if (!(await v.check())) {
        return helper.error(res, v.errors);
      }

      const existingUser = await AdminUser.findOne({
        userName: req.body.userName,
      });
      if (existingUser) {
        return helper.error(res, 'This userName is already in use');
      }

      req.body.password = await helper.passwordEncrypt(req.body.password);

      const role = await RoleManagement.findById(req.body.roleId);
      if (role) {
        req.body.roleType = role.roleType;
      }

      const newUser = await AdminUser.create(req.body);
      return helper.success(res, 'User Created Successfully.', newUser);
    } catch (error) {
      return helper.error(res, error.message);
    }
  },

  login: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        username: 'required|string',
        password: 'required|string',
      });

      if (!(await v.check())) {
        return helper.error(res, v.errors);
      }

      const user = await AdminUser.findOne({
        userName: req.body.username,
      }).select('+password');
      if (!user) {
        return helper.error(res, 'User not found');
      }

      const passwordMatch = await helper.comparePass(
        req.body.password,
        user.password
      );
      if (!passwordMatch) {
        return helper.error(res, 'Incorrect password');
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

      return helper.success(res, 'Login successful', {
        authToken: token,
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
            language: 'en',
            $and: [
              {
                lastPublishedDate: {
                  $gte: '2025-01-01T18:30:00.000Z',
                },
              },
              {
                lastPublishedDate: {
                  $lte: '2025-05-05T18:29:59.999Z',
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
        fieldsets: ['METRICS', 'URL', 'TRANSLATIONS'],
      });

      // Axios request configuration
      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://manage.wix.com/_api/communities-blog-node-api/v3/posts/query',
        headers: {
          authorization:
            'R2NP7hpV-bqM8xIbayfmdsVloRlVq39s8VdIItaTwbA.eyJpbnN0YW5jZUlkIjoiNzcwZTkyMjgtNjk1NS00YjBlLTgwY2YtOTBkM2VhNjJlYjhlIiwiYXBwRGVmSWQiOiIxNGJjZGVkNy0wMDY2LTdjMzUtMTRkNy00NjZjYjNmMDkxMDMiLCJtZXRhU2l0ZUlkIjoiYjQ3M2JhMDYtMWY2Ni00NGY0LTk2ODQtODZmY2Y3OWFhY2EzIiwic2lnbkRhdGUiOiIyMDI1LTA1LTA3VDEwOjA2OjE3LjI1OVoiLCJ1aWQiOiJmNTQzMWM0MS1kZTEwLTQyMTItYjhjNC0yNTEwZTM2MDM0ZmIiLCJwZXJtaXNzaW9ucyI6Ik9XTkVSIiwiZGVtb01vZGUiOmZhbHNlLCJiaVRva2VuIjoiYzM3ZDI4MmUtNzYzMy0wZmZhLTE2NGItMTYyZjFkZjg0NzJkIiwic2l0ZU93bmVySWQiOiI4MmNhMDRjYS1jYmVkLTRiN2ItODY3OS1iYjExYzFmZTZkNmYiLCJzaXRlTWVtYmVySWQiOiJhMDAwMzU4Mi0yZGMyLTQyNTgtYjU1ZS01NmYxZTg1YjM1YWEiLCJleHBpcmF0aW9uRGF0ZSI6IjIwMjUtMDUtMDdUMTQ6MDY6MTcuMjU5WiIsImxvZ2luQWNjb3VudElkIjoiZjU0MzFjNDEtZGUxMC00MjEyLWI4YzQtMjUxMGUzNjAzNGZiIiwibHBhaSI6bnVsbCwiYW9yIjp0cnVlLCJzY2QiOiIyMDIxLTAxLTE3VDIzOjI3OjM4LjI0NFoiLCJhY2QiOiIyMDI0LTEwLTMwVDE3OjQ0OjEzWiJ9',
          'X-XSRF-TOKEN':
            'R2NP7hpV-bqM8xIbayfmdsVloRlVq39s8VdIItaTwbA.eyJpbnN0YW5jZUlkIjoiNzcwZTkyMjgtNjk1NS00YjBlLTgwY2YtOTBkM2VhNjJlYjhlIiwiYXBwRGVmSWQiOiIxNGJjZGVkNy0wMDY2LTdjMzUtMTRkNy00NjZjYjNmMDkxMDMiLCJtZXRhU2l0ZUlkIjoiYjQ3M2JhMDYtMWY2Ni00NGY0LTk2ODQtODZmY2Y3OWFhY2EzIiwic2lnbkRhdGUiOiIyMDI1LTA1LTA3VDEwOjA2OjE3LjI1OVoiLCJ1aWQiOiJmNTQzMWM0MS1kZTEwLTQyMTItYjhjNC0yNTEwZTM2MDM0ZmIiLCJwZXJtaXNzaW9ucyI6Ik9XTkVSIiwiZGVtb01vZGUiOmZhbHNlLCJiaVRva2VuIjoiYzM3ZDI4MmUtNzYzMy0wZmZhLTE2NGItMTYyZjFkZjg0NzJkIiwic2l0ZU93bmVySWQiOiI4MmNhMDRjYS1jYmVkLTRiN2ItODY3OS1iYjExYzFmZTZkNmYiLCJzaXRlTWVtYmVySWQiOiJhMDAwMzU4Mi0yZGMyLTQyNTgtYjU1ZS01NmYxZTg1YjM1YWEiLCJleHBpcmF0aW9uRGF0ZSI6IjIwMjUtMDUtMDdUMTQ6MDY6MTcuMjU5WiIsImxvZ2luQWNjb3VudElkIjoiZjU0MzFjNDEtZGUxMC00MjEyLWI4YzQtMjUxMGUzNjAzNGZiIiwibHBhaSI6bnVsbCwiYW9yIjp0cnVlLCJzY2QiOiIyMDIxLTAxLTE3VDIzOjI3OjM4LjI0NFoiLCJhY2QiOiIyMDI0LTEwLTMwVDE3OjQ0OjEzWiJ9',
          'Content-Type': 'application/json',
          Cookie: 'XSRF-TOKEN=1746614101|IOkaR7uos9FI',
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

  fetchWixPosts1: async (req, res) => {
    try {
      const { limit = 40, offset = 0 } = req.body;

      const YOUR_AUTH_HEADER =
        '4DVN1_7ohsz9ZaT728GnwoA0rZxMU7Kw2_wQI8s97H0.eyJpbnN0YW5jZUlkIjoiNzcwZTkyMjgtNjk1NS00YjBlLTgwY2YtOTBkM2VhNjJlYjhlIiwiYXBwRGVmSWQiOiIxNGJjZGVkNy0wMDY2LTdjMzUtMTRkNy00NjZjYjNmMDkxMDMiLCJtZXRhU2l0ZUlkIjoiYjQ3M2JhMDYtMWY2Ni00NGY0LTk2ODQtODZmY2Y3OWFhY2EzIiwic2lnbkRhdGUiOiIyMDI1LTA1LTA5VDA0OjM2OjMwLjMwNFoiLCJ1aWQiOiJmNTQzMWM0MS1kZTEwLTQyMTItYjhjNC0yNTEwZTM2MDM0ZmIiLCJwZXJtaXNzaW9ucyI6Ik9XTkVSIiwiZGVtb01vZGUiOmZhbHNlLCJiaVRva2VuIjoiYzM3ZDI4MmUtNzYzMy0wZmZhLTE2NGItMTYyZjFkZjg0NzJkIiwic2l0ZU93bmVySWQiOiI4MmNhMDRjYS1jYmVkLTRiN2ItODY3OS1iYjExYzFmZTZkNmYiLCJzaXRlTWVtYmVySWQiOiJhMDAwMzU4Mi0yZGMyLTQyNTgtYjU1ZS01NmYxZTg1YjM1YWEiLCJleHBpcmF0aW9uRGF0ZSI6IjIwMjUtMDUtMDlUMDg6MzY6MzAuMzA0WiIsImxvZ2luQWNjb3VudElkIjoiZjU0MzFjNDEtZGUxMC00MjEyLWI4YzQtMjUxMGUzNjAzNGZiIiwibHBhaSI6bnVsbCwiYW9yIjp0cnVlLCJzY2QiOiIyMDIxLTAxLTE3VDIzOjI3OjM4LjI0NFoiLCJhY2QiOiIyMDI0LTEwLTMwVDE3OjQ0OjEzWiJ9';
      const YOUR_XSRF_TOKEN =
        '4DVN1_7ohsz9ZaT728GnwoA0rZxMU7Kw2_wQI8s97H0.eyJpbnN0YW5jZUlkIjoiNzcwZTkyMjgtNjk1NS00YjBlLTgwY2YtOTBkM2VhNjJlYjhlIiwiYXBwRGVmSWQiOiIxNGJjZGVkNy0wMDY2LTdjMzUtMTRkNy00NjZjYjNmMDkxMDMiLCJtZXRhU2l0ZUlkIjoiYjQ3M2JhMDYtMWY2Ni00NGY0LTk2ODQtODZmY2Y3OWFhY2EzIiwic2lnbkRhdGUiOiIyMDI1LTA1LTA5VDA0OjM2OjMwLjMwNFoiLCJ1aWQiOiJmNTQzMWM0MS1kZTEwLTQyMTItYjhjNC0yNTEwZTM2MDM0ZmIiLCJwZXJtaXNzaW9ucyI6Ik9XTkVSIiwiZGVtb01vZGUiOmZhbHNlLCJiaVRva2VuIjoiYzM3ZDI4MmUtNzYzMy0wZmZhLTE2NGItMTYyZjFkZjg0NzJkIiwic2l0ZU93bmVySWQiOiI4MmNhMDRjYS1jYmVkLTRiN2ItODY3OS1iYjExYzFmZTZkNmYiLCJzaXRlTWVtYmVySWQiOiJhMDAwMzU4Mi0yZGMyLTQyNTgtYjU1ZS01NmYxZTg1YjM1YWEiLCJleHBpcmF0aW9uRGF0ZSI6IjIwMjUtMDUtMDlUMDg6MzY6MzAuMzA0WiIsImxvZ2luQWNjb3VudElkIjoiZjU0MzFjNDEtZGUxMC00MjEyLWI4YzQtMjUxMGUzNjAzNGZiIiwibHBhaSI6bnVsbCwiYW9yIjp0cnVlLCJzY2QiOiIyMDIxLTAxLTE3VDIzOjI3OjM4LjI0NFoiLCJhY2QiOiIyMDI0LTEwLTMwVDE3OjQ0OjEzWiJ9';

      const requestData = {
        query: {
          filter: {
            language: 'en',
            $and: [
              {
                lastPublishedDate: {
                  $gte: '2025-01-01T18:30:00.000Z',
                },
              },
              {
                lastPublishedDate: {
                  $lte: '2025-05-05T18:29:59.999Z',
                },
              },
            ],
          },
          sort: [],
          paging: { limit, offset },
        },
        fieldsets: ['METRICS', 'URL', 'TRANSLATIONS'],
      };

      const config = {
        method: 'post',
        url: 'https://manage.wix.com/_api/communities-blog-node-api/v3/posts/query',
        headers: {
          authorization: YOUR_AUTH_HEADER,
          'X-XSRF-TOKEN': YOUR_XSRF_TOKEN,
          'Content-Type': 'application/json',
          Cookie: 'XSRF-TOKEN=YOUR_COOKIE',
        },
        data: JSON.stringify(requestData),
      };

      const { data } = await axios(config);
      const ids = data.posts.map((post) => post.id);

      const draftContents = {};

      // Fetch draft content for each ID
      for (const id of ids) {
        try {
          const draftConfig = {
            method: 'get',
            url: `https://manage.wix.com/_api/communities-blog-node-api/v3/draft-posts/${id}?draftPostId=${id}&fieldsets=RICH_CONTENT&fieldsets=URL&fieldsets=TRANSLATIONS`,
            headers: {
              authorization: YOUR_AUTH_HEADER,
              'X-XSRF-TOKEN': YOUR_XSRF_TOKEN,
              Cookie: 'XSRF-TOKEN=YOUR_COOKIE',
            },
          };

          const draftResponse = await axios(draftConfig);

          const richContentNodes =
            draftResponse?.data?.post?.richContent?.nodes || [];

          const firstImageNode = richContentNodes.find(
            (node) => node.type === 'IMAGE'
          );

          const imageAltText = firstImageNode?.imageData?.altText || '';
          const imageCaption = firstImageNode?.imageData?.caption || '';

          draftContents[id] =
            draftResponse.data?.draftPost?.richContent?.html || '';
        } catch (err) {
          console.error(
            `Failed to fetch draft content for ID ${id}:`,
            err.message
          );
          draftContents[id] = '';
        }
      }

      const formattedData = data.posts.map((post) => {
        // Get cover image URL if available
        const coverImageUrl = post.coverMedia?.image?.url || '';

        // Build content with title, image (if exists), and draft content
        let content = post.title;
        if (coverImageUrl) {
          content += `<br><img src="${coverImageUrl}" alt="${post.title}" />`;
        }
        if (draftContents[post.id]) {
          content += draftContents[post.id];
        }

        return {
          ID: '',
          Title: post.title,
          Content: content,
          Excerpt: post.excerpt || '',
          Date: dayjs(post.lastPublishedDate).format('YYYY-MM-DD HH:mm:ss'),
          'Post Type': 'post',
          Permalink: post.slug,
          'Image URL': coverImageUrl || post.media?.wixMedia?.image?.url || '',
          'Image Title': '',
          'Image Caption': '',
          'Image Description': '',
          'Image Alt Text': '',
          'Image Featured': '1',
          'Attachment URL': post.media?.wixMedia?.image?.url || '',
          Categories: post.category?.join(',') || '',
          Tags: post.tags?.join(',') || '',
          Status: post.status || 'draft',
          'Author ID': '1',
          'Author Username': 'admin',
          'Author Email': 'admin@example.com',
          'Author First Name': 'Admin',
          'Author Last Name': '',
          Slug: post.slug,
          Format: 'standard',
          Template: '',
          Parent: '',
          'Parent Slug': '',
          Order: '0',
          'Comment Status': post.allowComments ? 'open' : 'closed',
          'Ping Status': 'open',
          'Post Modified Date': dayjs(post.lastPublishedDate).format(
            'YYYY-MM-DD HH:mm:ss'
          ),
        };
      });

      const fields = [
        'ID',
        'Title',
        'Content',
        'Excerpt',
        'Date',
        'Post Type',
        'Permalink',
        'Image URL',
        'Image Title',
        'Image Caption',
        'Image Description',
        'Image Alt Text',
        'Image Featured',
        'Attachment URL',
        'Categories',
        'Tags',
        'Status',
        'Author ID',
        'Author Username',
        'Author Email',
        'Author First Name',
        'Author Last Name',
        'Slug',
        'Format',
        'Template',
        'Parent',
        'Parent Slug',
        'Order',
        'Comment Status',
        'Ping Status',
        'Post Modified Date',
      ];

      const parser = new Parser({ fields });
      const csv = parser.parse(formattedData);

      const outputPath = `D:/exports/wix_posts_limit-${limit}_offset-${offset}.csv`;
      fs.writeFileSync(outputPath, csv);

      return res
        .status(200)
        .json({ message: 'CSV exported successfully.', path: outputPath });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  fetchWixPosts3: async (req, res) => {
    try {
      const { limit = 40, offset = 0 } = req.body;

      const YOUR_AUTH_HEADER =
        '4DVN1_7ohsz9ZaT728GnwoA0rZxMU7Kw2_wQI8s97H0.eyJpbnN0YW5jZUlkIjoiNzcwZTkyMjgtNjk1NS00YjBlLTgwY2YtOTBkM2VhNjJlYjhlIiwiYXBwRGVmSWQiOiIxNGJjZGVkNy0wMDY2LTdjMzUtMTRkNy00NjZjYjNmMDkxMDMiLCJtZXRhU2l0ZUlkIjoiYjQ3M2JhMDYtMWY2Ni00NGY0LTk2ODQtODZmY2Y3OWFhY2EzIiwic2lnbkRhdGUiOiIyMDI1LTA1LTA5VDA0OjM2OjMwLjMwNFoiLCJ1aWQiOiJmNTQzMWM0MS1kZTEwLTQyMTItYjhjNC0yNTEwZTM2MDM0ZmIiLCJwZXJtaXNzaW9ucyI6Ik9XTkVSIiwiZGVtb01vZGUiOmZhbHNlLCJiaVRva2VuIjoiYzM3ZDI4MmUtNzYzMy0wZmZhLTE2NGItMTYyZjFkZjg0NzJkIiwic2l0ZU93bmVySWQiOiI4MmNhMDRjYS1jYmVkLTRiN2ItODY3OS1iYjExYzFmZTZkNmYiLCJzaXRlTWVtYmVySWQiOiJhMDAwMzU4Mi0yZGMyLTQyNTgtYjU1ZS01NmYxZTg1YjM1YWEiLCJleHBpcmF0aW9uRGF0ZSI6IjIwMjUtMDUtMDlUMDg6MzY6MzAuMzA0WiIsImxvZ2luQWNjb3VudElkIjoiZjU0MzFjNDEtZGUxMC00MjEyLWI4YzQtMjUxMGUzNjAzNGZiIiwibHBhaSI6bnVsbCwiYW9yIjp0cnVlLCJzY2QiOiIyMDIxLTAxLTE3VDIzOjI3OjM4LjI0NFoiLCJhY2QiOiIyMDI0LTEwLTMwVDE3OjQ0OjEzWiJ9';
      const YOUR_XSRF_TOKEN =
        '4DVN1_7ohsz9ZaT728GnwoA0rZxMU7Kw2_wQI8s97H0.eyJpbnN0YW5jZUlkIjoiNzcwZTkyMjgtNjk1NS00YjBlLTgwY2YtOTBkM2VhNjJlYjhlIiwiYXBwRGVmSWQiOiIxNGJjZGVkNy0wMDY2LTdjMzUtMTRkNy00NjZjYjNmMDkxMDMiLCJtZXRhU2l0ZUlkIjoiYjQ3M2JhMDYtMWY2Ni00NGY0LTk2ODQtODZmY2Y3OWFhY2EzIiwic2lnbkRhdGUiOiIyMDI1LTA1LTA5VDA0OjM2OjMwLjMwNFoiLCJ1aWQiOiJmNTQzMWM0MS1kZTEwLTQyMTItYjhjNC0yNTEwZTM2MDM0ZmIiLCJwZXJtaXNzaW9ucyI6Ik9XTkVSIiwiZGVtb01vZGUiOmZhbHNlLCJiaVRva2VuIjoiYzM3ZDI4MmUtNzYzMy0wZmZhLTE2NGItMTYyZjFkZjg0NzJkIiwic2l0ZU93bmVySWQiOiI4MmNhMDRjYS1jYmVkLTRiN2ItODY3OS1iYjExYzFmZTZkNmYiLCJzaXRlTWVtYmVySWQiOiJhMDAwMzU4Mi0yZGMyLTQyNTgtYjU1ZS01NmYxZTg1YjM1YWEiLCJleHBpcmF0aW9uRGF0ZSI6IjIwMjUtMDUtMDlUMDg6MzY6MzAuMzA0WiIsImxvZ2luQWNjb3VudElkIjoiZjU0MzFjNDEtZGUxMC00MjEyLWI4YzQtMjUxMGUzNjAzNGZiIiwibHBhaSI6bnVsbCwiYW9yIjp0cnVlLCJzY2QiOiIyMDIxLTAxLTE3VDIzOjI3OjM4LjI0NFoiLCJhY2QiOiIyMDI0LTEwLTMwVDE3OjQ0OjEzWiJ9';

      const requestData = {
        query: {
          filter: {
            language: 'en',
            $and: [
              {
                lastPublishedDate: {
                  $gte: '2025-01-01T18:30:00.000Z',
                },
              },
              {
                lastPublishedDate: {
                  $lte: '2025-05-05T18:29:59.999Z',
                },
              },
            ],
          },
          sort: [],
          paging: { limit, offset },
        },
        fieldsets: ['METRICS', 'URL', 'TRANSLATIONS'],
      };

      const config = {
        method: 'post',
        url: 'https://manage.wix.com/_api/communities-blog-node-api/v3/posts/query',
        headers: {
          authorization: YOUR_AUTH_HEADER,
          'X-XSRF-TOKEN': YOUR_XSRF_TOKEN,
          'Content-Type': 'application/json',
          Cookie: 'XSRF-TOKEN=YOUR_COOKIE',
        },
        data: JSON.stringify(requestData),
      };

      const { data } = await axios(config);
      const ids = data.posts.map((post) => post.id);

      const draftContents = {};

      // Function to process richContent nodes
      const processRichContent = (richContent) => {
        if (!richContent || !richContent.nodes) return '';

        let htmlContent = '';

        richContent.nodes.forEach((node) => {
          switch (node.type) {
            case 'PARAGRAPH':
              if (node.nodes && node.nodes.length > 0) {
                const paragraphText = node.nodes
                  .map((subNode) => {
                    if (
                      subNode.type === 'TEXT' &&
                      subNode.textData &&
                      subNode.textData.text
                    ) {
                      return subNode.textData.text;
                    }
                    return '';
                  })
                  .join('');

                if (paragraphText.trim()) {
                  htmlContent += `<p>${paragraphText}</p>`;
                }
              }
              break;

            case 'IMAGE':
              if (
                node.imageData &&
                node.imageData.image &&
                node.imageData.image.src
              ) {
                const src = node.imageData.image.src.id || '';
                const width = node.imageData.image.width || '';
                const height = node.imageData.image.height || '';
                htmlContent += `<img src="${src}" width="${width}" height="${height}" />`;
              }
              break;

            case 'VIDEO':
              if (
                node.videoData &&
                node.videoData.video &&
                node.videoData.video.src
              ) {
                const videoUrl = node.videoData.video.src.url || '';
                htmlContent += `<div class="video-embed"><iframe src="${videoUrl}" frameborder="0" allowfullscreen></iframe></div>`;
              }
              break;

            // Add more cases for other content types as needed
            default:
              // Handle other node types or ignore them
              break;
          }
        });

        return htmlContent;
      };

      // Fetch draft content for each ID
      for (const id of ids) {
        try {
          const draftConfig = {
            method: 'get',
            url: `https://manage.wix.com/_api/communities-blog-node-api/v3/draft-posts/${id}?draftPostId=${id}&fieldsets=RICH_CONTENT&fieldsets=URL&fieldsets=TRANSLATIONS`,
            headers: {
              authorization: YOUR_AUTH_HEADER,
              'X-XSRF-TOKEN': YOUR_XSRF_TOKEN,
              Cookie: 'XSRF-TOKEN=YOUR_COOKIE',
            },
          };

          const draftResponse = await axios(draftConfig);
          draftContents[id] =
            processRichContent(draftResponse.data?.draftPost?.richContent) ||
            '';
        } catch (err) {
          console.error(
            `Failed to fetch draft content for ID ${id}:`,
            err.message
          );
          draftContents[id] = '';
        }
      }

      const formattedData = data.posts.map((post) => {
        // Get cover image URL if available
        const coverImageUrl = post.coverMedia?.image?.url || '';

        // Build content with title, image (if exists), and draft content
        let content = `<h1>${post.title}</h1>`;
        if (coverImageUrl) {
          content += `<img src="${coverImageUrl}" alt="${post.title}" />`;
        }
        if (draftContents[post.id]) {
          content += draftContents[post.id];
        }

        return {
          ID: '',
          Title: post.title,
          Content: content,
          Excerpt: post.excerpt || '',
          Date: dayjs(post.lastPublishedDate).format('YYYY-MM-DD HH:mm:ss'),
          'Post Type': 'post',
          Permalink: post.slug,
          'Image URL': coverImageUrl || post.media?.wixMedia?.image?.url || '',
          'Image Title': '',
          'Image Caption': '',
          'Image Description': '',
          'Image Alt Text': '',
          'Image Featured': '1',
          'Attachment URL': post.media?.wixMedia?.image?.url || '',
          Categories: post.category?.join(',') || '',
          Tags: post.tags?.join(',') || '',
          Status: post.status || 'draft',
          'Author ID': '1',
          'Author Username': 'admin',
          'Author Email': 'admin@example.com',
          'Author First Name': 'Admin',
          'Author Last Name': '',
          Slug: post.slug,
          Format: 'standard',
          Template: '',
          Parent: '',
          'Parent Slug': '',
          Order: '0',
          'Comment Status': post.allowComments ? 'open' : 'closed',
          'Ping Status': 'open',
          'Post Modified Date': dayjs(post.lastPublishedDate).format(
            'YYYY-MM-DD HH:mm:ss'
          ),
        };
      });

      const fields = [
        'ID',
        'Title',
        'Content',
        'Excerpt',
        'Date',
        'Post Type',
        'Permalink',
        'Image URL',
        'Image Title',
        'Image Caption',
        'Image Description',
        'Image Alt Text',
        'Image Featured',
        'Featured Image',
        'Categories',
        'Tags',
        'Status',
        'Author ID',
        'Author Username',
        'Author Email',
        'Author First Name',
        'Author Last Name',
        'Slug',
        'Format',
        'Template',
        'Parent',
        'Parent Slug',
        'Order',
        'Comment Status',
        'Ping Status',
        'Post Modified Date',
      ];

      const parser = new Parser({ fields });
      const csv = parser.parse(formattedData);

      const outputPath = `D:/exports/wix_posts_limit-${limit}_offset-${offset}.csv`;
      fs.writeFileSync(outputPath, csv);

      return res
        .status(200)
        .json({ message: 'CSV exported successfully.', path: outputPath });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  fetchWixPosts: async (req, res) => {
    try {
      const { limit, offset } = req.body;

      // Static tag lookup
      const staticTags = {
        tags: [
          {
            id: '088e0e73-d4fd-4ab3-a119-f39c9a02d970',
            label: 'South Africa',
            slug: 'south-africa',
            createdDate: '2024-11-08T13:04:11.824Z',
            updatedDate: '2024-11-08T13:04:11.824Z',
            postCount: 997,
            publishedPostCount: 997,
            language: 'en',
          },
          {
            id: '3f139787-8c86-4fc8-ac06-af2dc49c52b0',
            label: 'Egypt',
            slug: 'egypt',
            createdDate: '2024-11-08T18:20:17.698Z',
            updatedDate: '2024-11-08T18:20:17.698Z',
            postCount: 668,
            publishedPostCount: 668,
            language: 'en',
          },
          {
            id: '1886df74-2b07-4098-8c5e-15521bb4a9f7',
            label: 'Ghana',
            slug: 'ghana',
            createdDate: '2024-11-08T22:16:33.738Z',
            updatedDate: '2024-11-08T22:16:33.738Z',
            postCount: 573,
            publishedPostCount: 573,
            language: 'en',
          },
          {
            id: '520a8e6a-3b11-4a16-aa98-e1cd38ecf197',
            label: 'Morocco',
            slug: 'morocco',
            createdDate: '2024-11-08T15:30:35.962Z',
            updatedDate: '2024-11-08T15:30:35.962Z',
            postCount: 559,
            publishedPostCount: 559,
            language: 'en',
          },
          {
            id: '3df2c99c-ddbb-4200-9d30-3980f4a5173b',
            label: 'South African Premiership',
            slug: 'south-african-premiership',
            createdDate: '2024-11-30T20:12:42.738Z',
            updatedDate: '2024-11-30T20:12:42.738Z',
            postCount: 481,
            publishedPostCount: 481,
            language: 'en',
          },
          {
            id: '395e97f5-4c4b-453d-87d0-2beae8cbbc63',
            label: 'Uganda',
            slug: 'uganda',
            createdDate: '2024-11-11T18:57:01.318Z',
            updatedDate: '2024-11-11T18:57:01.318Z',
            postCount: 454,
            publishedPostCount: 454,
            language: 'en',
          },
          {
            id: '20f7e418-5a9f-4355-ad1a-58cfd0bb67b6',
            label: 'Nigeria',
            slug: 'nigeria',
            createdDate: '2024-11-08T18:20:39.133Z',
            updatedDate: '2024-11-08T18:20:39.133Z',
            postCount: 433,
            publishedPostCount: 433,
            language: 'en',
          },
          {
            id: '5a75f62a-ccfd-4721-847c-0ef653dcf813',
            label: 'Tanzania',
            slug: 'tanzania',
            createdDate: '2024-11-15T14:37:34.413Z',
            updatedDate: '2024-11-15T14:37:34.413Z',
            postCount: 421,
            publishedPostCount: 421,
            language: 'en',
          },
          {
            id: 'afeb55cc-3846-4aa9-be22-1af99195c54b',
            label: 'Transfers',
            slug: 'transfers',
            createdDate: '2024-11-11T14:58:14.039Z',
            updatedDate: '2024-11-11T14:58:14.039Z',
            postCount: 358,
            publishedPostCount: 357,
            language: 'en',
          },
          {
            id: '67517de9-07a2-4162-b84a-40ee2c2ae093',
            label: 'World Cup Qualifying',
            slug: 'world-cup-qualifying',
            createdDate: '2024-11-15T14:45:57.988Z',
            updatedDate: '2024-11-15T14:45:57.988Z',
            postCount: 356,
            publishedPostCount: 356,
            language: 'en',
          },
          {
            id: '04d12d7a-781a-4e14-a4d5-f63cd2f854b3',
            label: 'Kenya',
            slug: 'kenya',
            createdDate: '2024-11-12T11:09:16.724Z',
            updatedDate: '2024-11-12T11:09:16.724Z',
            postCount: 350,
            publishedPostCount: 350,
            language: 'en',
          },
          {
            id: 'c72e136f-8aae-4025-9f58-be174b7da85f',
            label: 'Algeria',
            slug: 'algeria',
            createdDate: '2024-11-20T21:22:41.308Z',
            updatedDate: '2024-11-20T21:22:41.308Z',
            postCount: 299,
            publishedPostCount: 298,
            language: 'en',
          },
          {
            id: '35f396fa-1850-4e6e-8370-cf7ed85a55f3',
            label: 'Mamelodi Sundowns',
            slug: 'mamelodi-sundowns',
            createdDate: '2024-11-10T16:13:34.810Z',
            updatedDate: '2024-11-10T16:13:34.810Z',
            postCount: 285,
            publishedPostCount: 285,
            language: 'en',
          },
          {
            id: 'c1e66375-5290-4dfb-a404-4e57b6f36aa8',
            label: 'Orlando Pirates',
            slug: 'orlando-pirates',
            createdDate: '2024-11-22T17:32:12.307Z',
            updatedDate: '2024-11-22T17:32:12.307Z',
            postCount: 243,
            publishedPostCount: 243,
            language: 'en',
          },
          {
            id: 'cb050fa3-37ba-4624-9b95-6d6070053046',
            label: 'Tunisia',
            slug: 'tunisia',
            createdDate: '2024-11-22T15:57:54.848Z',
            updatedDate: '2024-11-22T15:57:54.848Z',
            postCount: 215,
            publishedPostCount: 215,
            language: 'en',
          },
          {
            id: '7ba3cf33-58b8-4913-b994-23614c748dda',
            label: 'Ethiopia',
            slug: 'ethiopia',
            createdDate: '2024-11-08T14:57:23.597Z',
            updatedDate: '2024-11-08T14:57:23.597Z',
            postCount: 206,
            publishedPostCount: 206,
            language: 'en',
          },
          {
            id: 'a51c2104-faca-46a7-aba8-4ab7391e08ee',
            label: 'Kaizer Chiefs',
            slug: 'kaizer-chiefs',
            createdDate: '2024-11-30T20:12:01.445Z',
            updatedDate: '2024-11-30T20:12:01.445Z',
            postCount: 202,
            publishedPostCount: 202,
            language: 'en',
          },
          {
            id: 'ed277c22-589f-44d9-a4b1-af187bd1bf24',
            label: 'Ghana Premier League',
            slug: 'ghana-premier-league',
            createdDate: '2024-11-08T22:16:31.513Z',
            updatedDate: '2024-11-08T22:16:31.513Z',
            postCount: 201,
            publishedPostCount: 201,
            language: 'en',
          },
          {
            id: '1f98b8e9-9be0-4752-844b-02d19819e0bc',
            label: 'Simba SC',
            slug: 'simba-sc',
            createdDate: '2024-11-22T15:41:43.999Z',
            updatedDate: '2024-11-22T15:41:43.999Z',
            postCount: 201,
            publishedPostCount: 201,
            language: 'en',
          },
          {
            id: '672d28d9-e979-4ad9-b2c3-897911517961',
            label: 'Al Ahly',
            slug: 'al-ahly',
            createdDate: '2024-11-08T21:33:09.764Z',
            updatedDate: '2024-11-08T21:33:09.764Z',
            postCount: 199,
            publishedPostCount: 199,
            language: 'en',
          },
          {
            id: '2fc10331-5a5d-44a5-a78e-c7f2b6e17246',
            label: 'Egyptian Premier League',
            slug: 'egyptian-premier-league',
            createdDate: '2024-11-08T21:32:59.848Z',
            updatedDate: '2024-11-08T21:32:59.848Z',
            postCount: 193,
            publishedPostCount: 193,
            language: 'en',
          },
          {
            id: 'd2cc7e69-4b15-471c-9431-a6975282a898',
            label: 'Malawi',
            slug: 'malawi',
            createdDate: '2024-11-16T02:53:06.302Z',
            updatedDate: '2024-11-16T02:53:06.302Z',
            postCount: 182,
            publishedPostCount: 182,
            language: 'en',
          },
          {
            id: 'e206206d-8a8e-449d-9d66-a03f19dddc22',
            label: 'Ivory Coast',
            slug: 'ivory-coast',
            createdDate: '2024-11-15T14:48:05.727Z',
            updatedDate: '2024-11-15T14:48:05.727Z',
            postCount: 177,
            publishedPostCount: 177,
            language: 'en',
          },
          {
            id: '0c2b0cce-5d76-4468-a8b0-ab84676086b4',
            label: 'Zamalek',
            slug: 'zamalek',
            createdDate: '2024-11-08T21:33:11.860Z',
            updatedDate: '2024-11-08T21:33:11.860Z',
            postCount: 168,
            publishedPostCount: 168,
            language: 'en',
          },
          {
            id: '170be2a4-6427-4169-b5d4-95232d40d571',
            label: 'Senegal',
            slug: 'senegal',
            createdDate: '2024-11-09T19:04:40.312Z',
            updatedDate: '2024-11-09T19:04:40.312Z',
            postCount: 166,
            publishedPostCount: 166,
            language: 'en',
          },
          {
            id: 'f6ea84a5-cdcb-4cd1-9c5d-8b1f2d9f93d9',
            label: 'Zambia',
            slug: 'zambia',
            createdDate: '2024-11-14T11:21:03.376Z',
            updatedDate: '2024-11-14T11:21:03.376Z',
            postCount: 164,
            publishedPostCount: 164,
            language: 'en',
          },
          {
            id: '52b55102-314b-4e69-9648-43ff28782a71',
            label: 'Young Africans',
            slug: 'young-africans',
            createdDate: '2024-11-15T14:37:41.491Z',
            updatedDate: '2024-11-15T14:37:41.491Z',
            postCount: 143,
            publishedPostCount: 143,
            language: 'en',
          },
          {
            id: 'af2e5982-f0bd-4fe6-bd09-9815bba2b3cf',
            label: 'DR Congo',
            slug: 'dr-congo',
            createdDate: '2024-11-08T18:21:42.847Z',
            updatedDate: '2024-11-08T18:21:42.847Z',
            postCount: 140,
            publishedPostCount: 139,
            language: 'en',
          },
          {
            id: 'ac3bc68c-1cc1-4490-8fb2-195cc056970b',
            label: 'Uganda Premier League',
            slug: 'uganda-premier-league',
            createdDate: '2024-11-30T20:35:17.052Z',
            updatedDate: '2024-11-30T20:35:17.052Z',
            postCount: 140,
            publishedPostCount: 140,
            language: 'en',
          },
          {
            id: '2fffd04e-a953-467c-88ec-bdc2d223ebc7',
            label: 'Ligi Kuu Bara Tanzania',
            slug: 'ligi-kuu-bara-tanzania',
            createdDate: '2024-11-15T14:38:15.234Z',
            updatedDate: '2024-11-15T14:38:15.234Z',
            postCount: 137,
            publishedPostCount: 137,
            language: 'en',
          },
          {
            id: 'bd546b93-8515-49b2-9b6d-7ff69d2cda4d',
            label: 'Zimbabwe',
            slug: 'zimbabwe',
            createdDate: '2024-11-14T01:27:33.214Z',
            updatedDate: '2024-11-14T01:27:33.214Z',
            postCount: 134,
            publishedPostCount: 133,
            language: 'en',
          },
          {
            id: 'ab1bb097-96d8-4b89-b1fa-b13367ea5c74',
            label: 'U-17',
            slug: 'u-17',
            createdDate: '2024-12-09T16:02:23.924Z',
            updatedDate: '2024-12-09T16:02:23.924Z',
            postCount: 131,
            publishedPostCount: 131,
            language: 'en',
          },
          {
            id: '99601db7-1b1c-4e23-bf08-86307d01946a',
            label: 'Stellenbosch',
            slug: 'stellenbosch',
            createdDate: '2024-11-22T17:37:31.536Z',
            updatedDate: '2024-11-22T17:37:31.536Z',
            postCount: 130,
            publishedPostCount: 130,
            language: 'en',
          },
          {
            id: 'ad9106ef-736d-44db-80f7-4b6c1c3e29e2',
            label: 'Pyramids FC',
            slug: 'pyramids-fc',
            createdDate: '2024-11-08T21:33:16.191Z',
            updatedDate: '2024-11-08T21:33:16.191Z',
            postCount: 125,
            publishedPostCount: 125,
            language: 'en',
          },
          {
            id: '62793005-0155-430f-8c86-0d0ed55abbc7',
            label: 'Cameroon',
            slug: 'cameroon',
            createdDate: '2024-11-13T13:29:25.258Z',
            updatedDate: '2024-11-13T13:29:25.258Z',
            postCount: 115,
            publishedPostCount: 115,
            language: 'en',
          },
          {
            id: 'aa95a096-068f-40b9-8f4c-9679beecadbf',
            label: 'Asante Kotoko',
            slug: 'asante-kotoko',
            createdDate: '2024-11-10T17:48:35.964Z',
            updatedDate: '2024-11-10T17:48:35.964Z',
            postCount: 111,
            publishedPostCount: 111,
            language: 'en',
          },
          {
            id: 'dee2b163-4950-483a-ba43-c778beb31a03',
            label: 'U-17 AFCON',
            slug: 'u-17-afcon',
            createdDate: '2024-11-26T16:20:56.110Z',
            updatedDate: '2024-11-26T16:20:56.110Z',
            postCount: 111,
            publishedPostCount: 111,
            language: 'en',
          },
          {
            id: '8039efa3-abda-4166-b296-6b3d9b0ad232',
            label: 'Ethiopian Premier League',
            slug: 'ethiopian-premier-league',
            createdDate: '2024-12-12T16:54:34.929Z',
            updatedDate: '2024-12-12T16:54:34.929Z',
            postCount: 110,
            publishedPostCount: 110,
            language: 'en',
          },
          {
            id: '096e15ff-bfbb-4984-9d05-a7ad40e1ecc7',
            label: 'AFCON Qualifying',
            slug: 'afcon-qualifying',
            createdDate: '2024-11-09T14:32:53.382Z',
            updatedDate: '2024-11-09T14:32:53.382Z',
            postCount: 103,
            publishedPostCount: 103,
            language: 'en',
          },
          {
            id: '314369d7-e817-4bc1-8db9-2afb0f07bceb',
            label: 'Angola',
            slug: 'angola',
            createdDate: '2024-11-13T12:12:13.580Z',
            updatedDate: '2024-11-13T12:12:13.580Z',
            postCount: 100,
            publishedPostCount: 100,
            language: 'en',
          },
          {
            id: '8d736615-016b-41c5-bf94-9f9bb3fb97be',
            label: 'Botola Pro',
            slug: 'botola-pro',
            createdDate: '2024-11-10T00:47:00.723Z',
            updatedDate: '2024-11-10T00:47:00.723Z',
            postCount: 99,
            publishedPostCount: 99,
            language: 'en',
          },
          {
            id: 'a9e6d805-d856-4ba2-b120-9de9f630de6e',
            label: 'AS FAR',
            slug: 'as-far',
            createdDate: '2024-11-09T19:04:33.694Z',
            updatedDate: '2024-11-09T19:04:33.694Z',
            postCount: 96,
            publishedPostCount: 96,
            language: 'en',
          },
          {
            id: '3d01e19b-62bc-4310-b205-82755235a17e',
            label: 'Raja CA',
            slug: 'raja-ca',
            createdDate: '2024-11-10T00:47:04.780Z',
            updatedDate: '2024-11-10T00:47:04.780Z',
            postCount: 93,
            publishedPostCount: 93,
            language: 'en',
          },
          {
            id: 'bb17789b-0164-4686-822c-7d84883c4431',
            label: 'Wydad AC',
            slug: 'wydad-ac',
            createdDate: '2024-11-10T00:47:09.760Z',
            updatedDate: '2024-11-10T00:47:09.760Z',
            postCount: 93,
            publishedPostCount: 93,
            language: 'en',
          },
          {
            id: 'df448b7e-d3e7-4b38-ada1-1abe4ce96901',
            label: 'Mali',
            slug: 'mali',
            createdDate: '2024-11-22T17:33:57.037Z',
            updatedDate: '2024-11-22T17:33:57.037Z',
            postCount: 91,
            publishedPostCount: 91,
            language: 'en',
          },
          {
            id: '1cfaa8b5-2dd1-4059-a888-df4e6876a8c9',
            label: 'Hearts of Oak',
            slug: 'hearts-of-oak',
            createdDate: '2024-11-15T14:40:37.838Z',
            updatedDate: '2024-11-15T14:40:37.838Z',
            postCount: 86,
            publishedPostCount: 84,
            language: 'en',
          },
          {
            id: '236f46c8-b704-4e44-9b02-eb1baf255ebd',
            label: 'Nedbank Cup',
            slug: 'nedbank-cup',
            createdDate: '2025-01-24T06:24:05.142Z',
            updatedDate: '2025-01-24T06:24:05.142Z',
            postCount: 86,
            publishedPostCount: 86,
            language: 'en',
          },
          {
            id: '13bbadcd-9e88-4cfc-acf8-44213b1e13c9',
            label: 'Gor Mahia',
            slug: 'gor-mahia',
            createdDate: '2024-11-12T11:09:42.376Z',
            updatedDate: '2024-11-12T11:09:42.376Z',
            postCount: 84,
            publishedPostCount: 83,
            language: 'en',
          },
          {
            id: '337b4411-5323-4729-9c01-40f404b485d7',
            label: 'Espérance',
            slug: 'espérance',
            createdDate: '2024-11-22T15:57:47.586Z',
            updatedDate: '2024-11-22T15:57:47.586Z',
            postCount: 84,
            publishedPostCount: 83,
            language: 'en',
          },
          {
            id: '37fb6af9-ea35-4ada-bb16-56f117cafa1c',
            label: 'RS Berkane',
            slug: 'rs-berkane',
            createdDate: '2024-11-22T17:37:40.159Z',
            updatedDate: '2024-11-22T17:37:40.159Z',
            postCount: 82,
            publishedPostCount: 82,
            language: 'en',
          },
        ],
        pagingMetadata: {
          count: 50,
          offset: 0,
          total: 303,
          cursors: {
            next: 'eyJmaWx0ZXIiOnt9LCJ2YWx1ZSI6eyJwb3N0Q291bnQiOjgyfSwib3JkZXIiOnsicG9zdENvdW50IjotMSwiX2lkIjoxfSwidHlwZSI6MH0=',
          },
          hasNext: true,
        },
      };

      // Create a tag ID to label map
      const tagMap = staticTags.tags.reduce((map, tag) => {
        map[tag.id] = tag.label;
        return map;
      }, {});

      const YOUR_AUTH_HEADER =
        'CycaTehQb1A0RELlqYxyvG6arg8mL0f0kuRg9VoHI18.eyJpbnN0YW5jZUlkIjoiNzcwZTkyMjgtNjk1NS00YjBlLTgwY2YtOTBkM2VhNjJlYjhlIiwiYXBwRGVmSWQiOiIxNGJjZGVkNy0wMDY2LTdjMzUtMTRkNy00NjZjYjNmMDkxMDMiLCJtZXRhU2l0ZUlkIjoiYjQ3M2JhMDYtMWY2Ni00NGY0LTk2ODQtODZmY2Y3OWFhY2EzIiwic2lnbkRhdGUiOiIyMDI1LTA3LTE5VDA1OjQxOjM1LjA3N1oiLCJ1aWQiOiJmNTQzMWM0MS1kZTEwLTQyMTItYjhjNC0yNTEwZTM2MDM0ZmIiLCJwZXJtaXNzaW9ucyI6Ik9XTkVSIiwiZGVtb01vZGUiOmZhbHNlLCJiaVRva2VuIjoiYzM3ZDI4MmUtNzYzMy0wZmZhLTE2NGItMTYyZjFkZjg0NzJkIiwic2l0ZU93bmVySWQiOiI4MmNhMDRjYS1jYmVkLTRiN2ItODY3OS1iYjExYzFmZTZkNmYiLCJzaXRlTWVtYmVySWQiOiJhMDAwMzU4Mi0yZGMyLTQyNTgtYjU1ZS01NmYxZTg1YjM1YWEiLCJleHBpcmF0aW9uRGF0ZSI6IjIwMjUtMDctMTlUMDk6NDE6MzUuMDc3WiIsImxvZ2luQWNjb3VudElkIjoiZjU0MzFjNDEtZGUxMC00MjEyLWI4YzQtMjUxMGUzNjAzNGZiIiwibHBhaSI6bnVsbCwiYW9yIjp0cnVlLCJzY2QiOiIyMDIxLTAxLTE3VDIzOjI3OjM4LjI0NFoiLCJhY2QiOiIyMDI0LTEwLTMwVDE3OjQ0OjEzWiJ9';
      const YOUR_XSRF_TOKEN =
        'CycaTehQb1A0RELlqYxyvG6arg8mL0f0kuRg9VoHI18.eyJpbnN0YW5jZUlkIjoiNzcwZTkyMjgtNjk1NS00YjBlLTgwY2YtOTBkM2VhNjJlYjhlIiwiYXBwRGVmSWQiOiIxNGJjZGVkNy0wMDY2LTdjMzUtMTRkNy00NjZjYjNmMDkxMDMiLCJtZXRhU2l0ZUlkIjoiYjQ3M2JhMDYtMWY2Ni00NGY0LTk2ODQtODZmY2Y3OWFhY2EzIiwic2lnbkRhdGUiOiIyMDI1LTA3LTE5VDA1OjQxOjM1LjA3N1oiLCJ1aWQiOiJmNTQzMWM0MS1kZTEwLTQyMTItYjhjNC0yNTEwZTM2MDM0ZmIiLCJwZXJtaXNzaW9ucyI6Ik9XTkVSIiwiZGVtb01vZGUiOmZhbHNlLCJiaVRva2VuIjoiYzM3ZDI4MmUtNzYzMy0wZmZhLTE2NGItMTYyZjFkZjg0NzJkIiwic2l0ZU93bmVySWQiOiI4MmNhMDRjYS1jYmVkLTRiN2ItODY3OS1iYjExYzFmZTZkNmYiLCJzaXRlTWVtYmVySWQiOiJhMDAwMzU4Mi0yZGMyLTQyNTgtYjU1ZS01NmYxZTg1YjM1YWEiLCJleHBpcmF0aW9uRGF0ZSI6IjIwMjUtMDctMTlUMDk6NDE6MzUuMDc3WiIsImxvZ2luQWNjb3VudElkIjoiZjU0MzFjNDEtZGUxMC00MjEyLWI4YzQtMjUxMGUzNjAzNGZiIiwibHBhaSI6bnVsbCwiYW9yIjp0cnVlLCJzY2QiOiIyMDIxLTAxLTE3VDIzOjI3OjM4LjI0NFoiLCJhY2QiOiIyMDI0LTEwLTMwVDE3OjQ0OjEzWiJ9';

      const requestData = {
        query: {
          filter: {
            language: 'en',
            $and: [
              {
                lastPublishedDate: {
                  $gte: '2025-01-01T00:00:00.000Z',
                },
              },
              {
                lastPublishedDate: {
                  $lte: '2025-07-20T23:59:59.999Z',
                },
              },
            ],
          },
          sort: [],
          paging: { limit, offset },
        },
        fieldsets: ['METRICS', 'URL', 'TRANSLATIONS'],
      };

      const config = {
        method: 'post',
        url: 'https://manage.wix.com/_api/communities-blog-node-api/v3/posts/query',
        headers: {
          authorization: YOUR_AUTH_HEADER,
          'X-XSRF-TOKEN': YOUR_XSRF_TOKEN,
          'Content-Type': 'application/json',
          Cookie: 'XSRF-TOKEN=YOUR_COOKIE',
        },
        data: JSON.stringify(requestData),
      };

      const { data } = await axios(config);

      const ids = data.posts.map((post) => post.id);
      const metrics = data.posts.map((post) => post.metrics);

      const draftContents = {};

      const tagIds = data.posts.map((post) => post.tagIds);

      const richContent = data.posts.map((post) => post.richContent);

      const memberId = data.posts.map((post) => post.memberId);
      const memberIds = data.posts.map((post) => post.memberId);

      const uniqueMemberIds = [...new Set(memberIds)];

      const membersData = [];
      for (const memberId of uniqueMemberIds) {
        try {
          const requestData = {
            query: {
              paging: { limit: 1 },
              filter: { id: { $in: [memberId] } },
            },
          };

          const config = {
            method: 'post',
            url: 'https://manage.wix.com/_api/members/v1/members/query',
            headers: {
              authorization: YOUR_AUTH_HEADER,
              'X-XSRF-TOKEN': YOUR_XSRF_TOKEN,
              'Content-Type': 'application/json',
              Cookie: 'XSRF-TOKEN=YOUR_COOKIE',
            },
            data: JSON.stringify(requestData),
          };

          const res = await axios(config);
          const member = res.data?.members?.[0];

          if (member) {
            membersData.push({
              id: member.id,
              nickname: member.profile?.nickname || '',
              photoUrl: member.profile?.photo?.url || '',
            });
          }
        } catch (err) {
          console.error(`Error fetching member ${memberId}:`, err.message);
        }
      }

      // Get all unique category IDs from all posts
      const allCategoryIds = [
        ...new Set(data.posts.flatMap((post) => post.categoryIds || [])),
      ];

      // Create a map to store category ID to name mapping
      const categoryMap = {};

      // Fetch category details for each unique category ID
      for (const categoryId of allCategoryIds) {
        try {
          const categoryConfig = {
            method: 'get',
            url: `https://manage.wix.com/_api/communities-blog-node-api/v3/categories/${categoryId}?fieldsets=SEO&categoryId=${categoryId}`,
            headers: {
              authorization: YOUR_AUTH_HEADER,
              'X-XSRF-TOKEN': YOUR_XSRF_TOKEN,
              Cookie: 'XSRF-TOKEN=YOUR_COOKIE',
            },
          };

          const categoryResponse = await axios(categoryConfig);
          categoryMap[categoryId] =
            categoryResponse.data?.category?.label ||
            `Unknown Category (${categoryId})`;
        } catch (err) {
          console.error(`Failed to fetch category ${categoryId}:`, err.message);
          categoryMap[categoryId] = `Unknown Category (${categoryId})`;
        }
      }

      const processRichContent = (richContent) => {
        if (!richContent || !richContent.nodes) return '';

        let htmlContent = '';

        richContent.nodes.forEach((node) => {
          switch (node.type) {
            case 'PARAGRAPH':
              if (node.nodes && node.nodes.length > 0) {
                const paragraphText = node.nodes
                  .map((subNode) => {
                    if (
                      subNode.type === 'TEXT' &&
                      subNode.textData &&
                      subNode.textData.text
                    ) {
                      return subNode.textData.text;
                    }
                    return '';
                  })
                  .join('');

                if (paragraphText.trim()) {
                  htmlContent += `<p>${paragraphText}</p>`;
                }
              }
              break;

            case 'IMAGE':
              if (node.imageData?.image?.src?.id?.startsWith('https://')) {
                const src = node.imageData.image.src.id;
                const width = node.imageData.image.width || '';
                const height = node.imageData.image.height || '';
                htmlContent += `<img src="${src}" width="${width}" height="${height}" />`;
              }
              break;

            // case 'VIDEO':
            //   if (
            //     node.videoData &&
            //     node.videoData.video &&
            //     node.videoData.video.src
            //   ) {
            //     const videoUrl = node.videoData.video.src.url || '';
            //     htmlContent += `<div class="video-embed">${videoUrl}</div>`;
            //   }
            //   break;
            case 'VIDEO':
              if (
                node.videoData &&
                node.videoData.video &&
                node.videoData.video.src &&
                node.videoData.video.src.url
              ) {
                const originalUrl = node.videoData.video.src.url;
                let embedUrl = originalUrl;

                // Convert YouTube watch URL to embed URL
                const match = originalUrl.match(
                  /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
                );
                if (match && match[1]) {
                  embedUrl = `https://www.youtube.com/embed/${match[1]}`;
                }

                htmlContent += `<iframe width="560" height="315" src="${embedUrl}" frameborder="0" allowfullscreen></iframe>`;
              }
              break;

            case 'TABLE':
              if (node.nodes?.length) {
                htmlContent += `<table border="1">`;
                node.nodes.forEach((row) => {
                  if (row.type === 'TABLE_ROW' && row.nodes?.length) {
                    htmlContent += `<tr>`;
                    row.nodes.forEach((cell) => {
                      const cellContent = (cell.nodes || [])
                        .map((cellNode) => {
                          if (cellNode.type === 'PARAGRAPH') {
                            return (cellNode.nodes || [])
                              .map((textNode) =>
                                textNode.type === 'TEXT' &&
                                textNode.textData?.text
                                  ? textNode.textData.text
                                  : ''
                              )
                              .join('');
                          }
                          return '';
                        })
                        .join('');
                      htmlContent += `<td>${cellContent}</td>`;
                    });
                    htmlContent += `</tr>`;
                  }
                });
                htmlContent += `</table>`;
              }
              break;

            default:
              break;
          }
        });

        return htmlContent;
      };

      for (const id of ids) {
        try {
          const draftConfig = {
            method: 'get',
            url: `https://manage.wix.com/_api/communities-blog-node-api/v3/draft-posts/${id}?draftPostId=${id}&fieldsets=RICH_CONTENT&fieldsets=URL&fieldsets=TRANSLATIONS`,
            headers: {
              authorization: YOUR_AUTH_HEADER,
              'X-XSRF-TOKEN': YOUR_XSRF_TOKEN,
              Cookie: 'XSRF-TOKEN=YOUR_COOKIE',
            },
          };
          const draftResponse = await axios(draftConfig);
          const imageNode =
            draftResponse.data?.draftPost?.richContent?.nodes?.find(
              (node) => node.type === 'IMAGE'
            );

          const imageAltText = imageNode?.imageData?.altText || '';
          const imageCaption = imageNode?.imageData?.caption || '';

          draftContents[id] = {
            content:
              processRichContent(draftResponse.data?.draftPost?.richContent) ||
              '',
            imageAltText,
            imageCaption,
          };
        } catch (err) {
          console.error(
            `Failed to fetch draft content for ID ${id}:`,
            err.message
          );
          draftContents[id] = '';
        }
      }

      const memberMap = {};
      for (const member of membersData) {
        memberMap[member.id] = {
          nickname: member.nickname,
          photoUrl: member.photoUrl,
        };
      }

      // Build ID-to-Title map for related posts
      const postIdToTitleMap = {};
      data.posts.forEach((post) => {
        postIdToTitleMap[post.id] = post.title || '';
      });

      const formattedData = data.posts.map((post) => {
        const coverImageUrl = post.coverMedia?.image?.url || '';

        // Map category IDs to their names
        const categoryNames = (post.categoryIds || []).map(
          (id) => categoryMap[id] || `Unknown Category (${id})`
        );

        // Draft content and image metadata
        const {
          content = '',
          imageAltText = '',
          imageCaption = '',
        } = draftContents[post.id] || {};

        const author = memberMap[post.memberId] || {
          nickname: 'admin',
          photoUrl: '',
        };

        // Related post titles (fallback to ID if not found)
        const relatedPostTitles = (post.relatedPostIds || [])
          .map((id) => postIdToTitleMap[id] || id)
          .join(', ');

        return {
          ID: post.id,
          Title: post.title,
          Content: content,
          Excerpt: post.excerpt || '',
          Date: dayjs(post.lastPublishedDate).format('YYYY-MM-DD HH:mm:ss'),
          'Post Type': 'post',
          Permalink: post.slug,
          'URL Base': post.url?.base || '',
          'URL Path': post.url?.path || '',
          'Image URL': coverImageUrl || post.media?.wixMedia?.image?.url || '',
          'Image Title': '',
          'Image Caption': imageCaption,
          'Image Alt Text': imageAltText,
          'Image Featured': '1',
          'Attachment URL': post.media?.wixMedia?.image?.url || '',
          Tags: (post.tagIds || [])
            .filter((id) => tagMap[id])
            .map((id) => tagMap[id])
            .join(', '),
          Likes: post.metrics?.likes || 0,
          Views: post.metrics?.views || 0,
          'Minutes to Read': post.minutesToRead || 0,
          // ✅ Newly added fields
          'Related Posts': relatedPostTitles,
          'Related Post IDs': (post.relatedPostIds || []).join(', '),
          Status: post.status || 'draft',
          'Author Username': author.nickname || 'admin',
          'Author Photo': author.photoUrl || '',
          Slug: post.slug,
          Format: 'standard',
          Template: '',
          Parent: '',
          'Parent Slug': '',
          Order: '0',
          'Comment Status': post.allowComments ? 'open' : 'closed',
          'Ping Status': 'open',
          'Post Modified Date': dayjs(post.lastPublishedDate).format(
            'YYYY-MM-DD HH:mm:ss'
          ),
          Categories: categoryNames.join(', '),
        };
      });

      const fields = [
        'ID',
        'Title',
        'Content',
        'Excerpt',
        'Date',
        'Post Type',
        'Permalink',
        'URL Base',
        'URL Path',
        'Image URL',
        'Image Title',
        'Image Caption',
        'Image Alt Text',
        'Image Featured',
        'Attachment URL',
        'Tags',
        'Likes',
        'Views',
        'Minutes to Read',
        'Related Posts', // ✅ New
        'Related Post IDs', // ✅ New
        'Status',
        'Author Username',
        'Author Photo',
        'Slug',
        'Format',
        'Template',
        'Parent',
        'Parent Slug',
        'Order',
        'Comment Status',
        'Ping Status',
        'Post Modified Date',
        'Categories',
      ];

      const parser = new Parser({ fields });
      const csv = parser.parse(formattedData);

      const outputPath = `D:/exports/wix_posts_limit-${limit}_offset-${offset}.csv`;
      fs.writeFileSync(outputPath, '\uFEFF' + csv, { encoding: 'utf8' });

      return res
        .status(200)
        .json({ message: 'CSV exported successfully.', path: outputPath });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  fetchWixPostsRPost: async (req, res) => {
    try {
      const { limit, offset } = req.body;

      const YOUR_AUTH_HEADER =
        '-bnAFCPrpM7a2vwPBifn3-wTsj9IpHUkDr61eF9xiYk.eyJpbnN0YW5jZUlkIjoiNzcwZTkyMjgtNjk1NS00YjBlLTgwY2YtOTBkM2VhNjJlYjhlIiwiYXBwRGVmSWQiOiIxNGJjZGVkNy0wMDY2LTdjMzUtMTRkNy00NjZjYjNmMDkxMDMiLCJtZXRhU2l0ZUlkIjoiYjQ3M2JhMDYtMWY2Ni00NGY0LTk2ODQtODZmY2Y3OWFhY2EzIiwic2lnbkRhdGUiOiIyMDI1LTA3LTIxVDA2OjQ2OjM2LjI2NVoiLCJ1aWQiOiJmNTQzMWM0MS1kZTEwLTQyMTItYjhjNC0yNTEwZTM2MDM0ZmIiLCJwZXJtaXNzaW9ucyI6Ik9XTkVSIiwiZGVtb01vZGUiOmZhbHNlLCJiaVRva2VuIjoiYzM3ZDI4MmUtNzYzMy0wZmZhLTE2NGItMTYyZjFkZjg0NzJkIiwic2l0ZU93bmVySWQiOiI4MmNhMDRjYS1jYmVkLTRiN2ItODY3OS1iYjExYzFmZTZkNmYiLCJzaXRlTWVtYmVySWQiOiJhMDAwMzU4Mi0yZGMyLTQyNTgtYjU1ZS01NmYxZTg1YjM1YWEiLCJleHBpcmF0aW9uRGF0ZSI6IjIwMjUtMDctMjFUMTA6NDY6MzYuMjY1WiIsImxvZ2luQWNjb3VudElkIjoiZjU0MzFjNDEtZGUxMC00MjEyLWI4YzQtMjUxMGUzNjAzNGZiIiwibHBhaSI6bnVsbCwiYW9yIjp0cnVlLCJzY2QiOiIyMDIxLTAxLTE3VDIzOjI3OjM4LjI0NFoiLCJhY2QiOiIyMDI0LTEwLTMwVDE3OjQ0OjEzWiJ9';
      const YOUR_XSRF_TOKEN =
        '-bnAFCPrpM7a2vwPBifn3-wTsj9IpHUkDr61eF9xiYk.eyJpbnN0YW5jZUlkIjoiNzcwZTkyMjgtNjk1NS00YjBlLTgwY2YtOTBkM2VhNjJlYjhlIiwiYXBwRGVmSWQiOiIxNGJjZGVkNy0wMDY2LTdjMzUtMTRkNy00NjZjYjNmMDkxMDMiLCJtZXRhU2l0ZUlkIjoiYjQ3M2JhMDYtMWY2Ni00NGY0LTk2ODQtODZmY2Y3OWFhY2EzIiwic2lnbkRhdGUiOiIyMDI1LTA3LTIxVDA2OjQ2OjM2LjI2NVoiLCJ1aWQiOiJmNTQzMWM0MS1kZTEwLTQyMTItYjhjNC0yNTEwZTM2MDM0ZmIiLCJwZXJtaXNzaW9ucyI6Ik9XTkVSIiwiZGVtb01vZGUiOmZhbHNlLCJiaVRva2VuIjoiYzM3ZDI4MmUtNzYzMy0wZmZhLTE2NGItMTYyZjFkZjg0NzJkIiwic2l0ZU93bmVySWQiOiI4MmNhMDRjYS1jYmVkLTRiN2ItODY3OS1iYjExYzFmZTZkNmYiLCJzaXRlTWVtYmVySWQiOiJhMDAwMzU4Mi0yZGMyLTQyNTgtYjU1ZS01NmYxZTg1YjM1YWEiLCJleHBpcmF0aW9uRGF0ZSI6IjIwMjUtMDctMjFUMTA6NDY6MzYuMjY1WiIsImxvZ2luQWNjb3VudElkIjoiZjU0MzFjNDEtZGUxMC00MjEyLWI4YzQtMjUxMGUzNjAzNGZiIiwibHBhaSI6bnVsbCwiYW9yIjp0cnVlLCJzY2QiOiIyMDIxLTAxLTE3VDIzOjI3OjM4LjI0NFoiLCJhY2QiOiIyMDI0LTEwLTMwVDE3OjQ0OjEzWiJ9';

      const requestData = {
        query: {
          filter: {
            language: 'en',
            $and: [
              {
                lastPublishedDate: {
                  $gte: '2025-01-01T00:00:00.000Z',
                },
              },
              {
                lastPublishedDate: {
                  $lte: '2025-07-20T23:59:59.999Z',
                },
              },
            ],
          },
          paging: { limit, offset },
        },
        fieldsets: ['METRICS', 'URL', 'TRANSLATIONS'],
      };

      const config = {
        method: 'post',
        url: 'https://manage.wix.com/_api/communities-blog-node-api/v3/posts/query',
        headers: {
          authorization: YOUR_AUTH_HEADER,
          'X-XSRF-TOKEN': YOUR_XSRF_TOKEN,
          'Content-Type': 'application/json',
          Cookie: 'XSRF-TOKEN=YOUR_COOKIE',
        },
        data: JSON.stringify(requestData),
      };

      const { data } = await axios(config);
      const posts = data.posts;

      // Collect all unique relatedPostIds
      const relatedPostIds = new Set();
      posts.forEach((post) => {
        (post.relatedPostIds || []).forEach((id) => relatedPostIds.add(id));
      });

      // Fetch titles for relatedPostIds
      let relatedIdToTitleMap = {};
      if (relatedPostIds.size > 0) {
        const relatedPostConfig = {
          method: 'post',
          url: 'https://manage.wix.com/_api/communities-blog-node-api/v3/posts/query',
          headers: {
            authorization: YOUR_AUTH_HEADER,
            'X-XSRF-TOKEN': YOUR_XSRF_TOKEN,
            'Content-Type': 'application/json',
            Cookie: 'XSRF-TOKEN=YOUR_COOKIE',
          },
          data: JSON.stringify({
            query: {
              filter: { id: { $in: [...relatedPostIds] } },
              paging: { limit: relatedPostIds.size },
            },
            fieldsets: ['TITLE'],
          }),
        };

        const relatedData = await axios(relatedPostConfig);
        relatedData.data.posts.forEach((post) => {
          relatedIdToTitleMap[post.id] = post.title || '';
        });
      }

      // Format the data
      const formattedData = posts.map((post) => {
        const relatedIds = post.relatedPostIds || [];
        const relatedPostTitles = relatedIds
          .map((id) => relatedIdToTitleMap[id])
          .filter(Boolean)
          .join(', ');

        const relatedPostIdString = relatedIds.join(', ');

        return {
          Title: post.title,
          'Related Posts': relatedPostTitles,
          'Related Post IDs': relatedPostIdString,
        };
      });

      const fields = ['Title', 'Related Posts', 'Related Post IDs'];
      const parser = new Parser({ fields });
      const csv = parser.parse(formattedData);

      const outputPath = `D:/exports/wix_related_posts_limit-${limit}_offset-${offset}.csv`;
      fs.writeFileSync(outputPath, '\uFEFF' + csv, { encoding: 'utf8' });

      return res.status(200).json({
        message: 'CSV with related posts and IDs exported successfully.',
        path: outputPath,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },
};

export default userController;

const cleanText = (text) => {
  return he
    .decode(text || '')
    .replace(/\n/g, ' ')
    .replace(/[^\x20-\x7E]+/g, '') // remove non-ASCII chars
    .trim();
};
