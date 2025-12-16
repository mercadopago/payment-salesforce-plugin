module.exports = {
  createService: () => ({
    call: (requestObject) => {
      // Return site_id for /users/me endpoint
      if (requestObject && requestObject.endpoint === "/users/me") {
        return {
          ok: true,
          object: {
            site_id: "MLC"
          }
        };
      }
      return {
        ok: true,
        object: {}
      };
    }
  })
};
