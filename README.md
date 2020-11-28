# Covid-SG

A visualisation of Covid-19 related cases in Singapore from 23 January 2020 to 10 April 2020. Red dots signify patients who are infected, Green indicating recovered, and Black indicating deceased.

Change between 6 different views:

1. Alternating rings, with each ring signifying a week, and the dots in each ring signifying each patient
2. Bar graph - X axis represents the dates, this might be what people are more used to seing
3. Brownian motion - The dots simply bounce around, with no significant meaning in data.
4. Link Graph - How cases are linked: Green for friends, Red for Close Contacts, and Blue for the location.
5. Dots in the shape of Singapore - no significant meaning in terms of data, just wanted to see it.
6. Ball - The dots are clustered in the center in the form of a ball.

Viewable online [here](https://walnutdust.github.io/covid-sg/)

Created with d3 and React. This project is currently archived.

## How to Use

Simply clone the repository and `yarn start` or `npm start`.

## Reflections

From this project, I got some brief exposure to d3.js, which I have always wanted to explore but never found the opportunity to do so. In this process I may have inadvertently made the project harder for myself than I needed to because both React and d3 preferred to be the master of the DOM, and it was challenging to reconcile the process between the two. Articles such as [this](https://medium.com/@tibotiber/react-d3-js-balancing-performance-developer-experience-4da35f912484) were helpful in pointing me in a good direction.

This project was born out of a wanting to treat each case as more than just a number or statistic. It was important to me that a viewer could visually track individual dots as they transformed between the different visualizations, that these were individual people with stories. Given more time I would have continued the project, but manually keeping track of links based on every day's update was unsustainable. That Singapore saw an explosion in cases soon afterward also made it hard for performance reasons. The color scheme chosen was also not suitable for people with Red-Green colorblindness. If possible, I also would have wanted to make it such that hovering over each dot will provide information about the individual's case.

## Contributors

Garett Tok Ern Liang [(walnutdust)](https://github.com/walnutdust/)
