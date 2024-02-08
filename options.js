async function getCountryCode() {
  const url = "./country.json";
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Network response was not ok (HTTP Status: ${response.status})`
      );
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function getCCAndHandle() {
  return getCountryCode()
    .then((data) => {
      // console.log(data);
      return {
        country_code: parseCountryCode(data),
      };
    })
    .catch((error) => {
      console.error(error);
    });
}

function parseCountryCode({ country_codes }) {
  return country_codes.map((item) => {
    return {
      coun: item.country,
      lat: item.latitude,
      long: item.longitude,
    };
  });
}
