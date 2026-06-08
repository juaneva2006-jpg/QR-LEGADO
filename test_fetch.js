async function test() {
  const apiKey = 'AQ.Ab8RN6KEirjabSw6-R-7xXUgDKpRaok51CZYK0K7OrhNz7Z0dA';
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch(e) {
    console.error(e);
  }
}
test();
