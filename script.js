const API_KEY = '8dc674e'; // Replace with your OMDb API key
const BASE_URL = 'http://www.omdbapi.com/';
const API_URL = `${BASE_URL}?apikey=${API_KEY}&s=movie&type=movie`;
const IMG_URL = '';
const searchURL = `${BASE_URL}?apikey=${API_KEY}&s=`;

const genres = [
    { "id": 28, "name": "Action" },
    { "id": 12, "name": "Adventure" },
    { "id": 16, "name": "Animation" },
    { "id": 35, "name": "Comedy" },
    { "id": 80, "name": "Crime" },
    { "id": 99, "name": "Documentary" },
    { "id": 18, "name": "Drama" },
    { "id": 10751, "name": "Family" },
    { "id": 14, "name": "Fantasy" },
    { "id": 36, "name": "History" },
    { "id": 27, "name": "Horror" },
    { "id": 10402, "name": "Music" },
    { "id": 9648, "name": "Mystery" },
    { "id": 10749, "name": "Romance" },
    { "id": 878, "name": "Science Fiction" },
    { "id": 10770, "name": "TV Movie" },
    { "id": 53, "name": "Thriller" },
    { "id": 10752, "name": "War" },
    { "id": 37, "name": "Western" }
];

const main = document.getElementById('main');
const form = document.getElementById('form');
const search = document.getElementById('search');
const tagsEl = document.getElementById('tags');

const prev = document.getElementById('prev');
const next = document.getElementById('next');
const current = document.getElementById('current');

var currentPage = 1;
var nextPage = 2;
var prevPage = 0;
var lastUrl = '';
var totalPages = 100;

var selectedGenre = [];
setGenre();
function setGenre() {
    tagsEl.innerHTML = '';
    genres.forEach(genre => {
        const t = document.createElement('div');
        t.classList.add('tag');
        t.id = genre.id;
        t.innerText = genre.name;
        t.addEventListener('click', () => {
            if (selectedGenre.length == 0) {
                selectedGenre.push(genre.name.toLowerCase());
            } else {
                if (selectedGenre.includes(genre.name.toLowerCase())) {
                    selectedGenre = selectedGenre.filter(g => g !== genre.name.toLowerCase());
                } else {
                    selectedGenre.push(genre.name.toLowerCase());
                }
            }
            console.log(selectedGenre);
            getMovies(lastUrl || API_URL);
            highlightSelection();
        });
        tagsEl.append(t);
    });
}

function highlightSelection() {
    const tags = document.querySelectorAll('.tag');
    tags.forEach(tag => {
        tag.classList.remove('highlight');
    });
    clearBtn();
    if (selectedGenre.length != 0) {
        selectedGenre.forEach(genre => {
            const highlightedTag = Array.from(document.querySelectorAll('.tag')).find(tag => tag.innerText.toLowerCase() === genre);
            if (highlightedTag) highlightedTag.classList.add('highlight');
        });
    }
}

function clearBtn() {
    let clearBtn = document.getElementById('clear');
    if (clearBtn) {
        clearBtn.classList.add('highlight');
    } else {
        let clear = document.createElement('div');
        clear.classList.add('tag', 'highlight');
        clear.id = 'clear';
        clear.innerText = 'Clear x';
        clear.addEventListener('click', () => {
            selectedGenre = [];
            setGenre();
            getMovies(API_URL);
        });
        tagsEl.append(clear);
    }
}

getMovies(API_URL);

async function getMovies(url) {
    lastUrl = url;
    const res = await fetch(url);
    const data = await res.json();
    console.log(data);
    if (data.Search && data.Search.length !== 0) {
        const detailedMovies = await Promise.all(
            data.Search.map(async (movie) => {
                const detailRes = await fetch(`${BASE_URL}?i=${movie.imdbID}&plot=full&apikey=${API_KEY}`);
                const detailData = await detailRes.json();
                return detailData;
            })
        );

        // Filter movies by selected genres (client-side)
        const filteredMovies = selectedGenre.length > 0
            ? detailedMovies.filter(movie => {
                  const movieGenres = movie.Genre.toLowerCase().split(', ').map(g => g.trim());
                  return selectedGenre.some(genre => movieGenres.includes(genre));
              })
            : detailedMovies;

        showMovies(filteredMovies);

        currentPage = parseInt(new URLSearchParams(new URL(url).search).get('page') || '1');
        nextPage = currentPage + 1;
        prevPage = currentPage - 1;
        totalPages = Math.ceil(data.totalResults / 10);

        current.innerText = currentPage;

        if (currentPage <= 1) {
            prev.classList.add('disabled');
            next.classList.remove('disabled');
        } else if (currentPage >= totalPages) {
            prev.classList.remove('disabled');
            next.classList.add('disabled');
        } else {
            prev.classList.remove('disabled');
            next.classList.remove('disabled');
        }

        tagsEl.scrollIntoView({ behavior: 'smooth' });
    } else {
        main.innerHTML = `<h1 class="no-results">No Results Found</h1>`;
    }
}

function showMovies(data) {
    main.innerHTML = '';
    data.forEach(movie => {
        const { Title: title, Poster: poster_path, imdbRating: vote_average, Plot: overview, imdbID: id } = movie;
        const displayOverview = overview && overview !== 'N/A' ? overview : 'Overview not available.';

        const movieEl = document.createElement('div');
        movieEl.classList.add('movie');
        movieEl.innerHTML = `
            <div class="poster-container">
                <img src="${poster_path !== 'N/A' ? poster_path : "http://via.placeholder.com/1080x1580" }" alt="${title}">
                <span class="rating-on-poster ${getColor(vote_average)}">${vote_average}</span>
            </div>
            <div class="movie-info">
                <h3>${title}</h3>
            </div>
            <div class="overview">
                <h3>Overview</h3>
                ${displayOverview}
            </div>
        `;
        main.appendChild(movieEl);
    });
}

function getColor(vote) {
    if (vote >= 8) {
        return 'green';
    } else if (vote >= 5) {
        return 'orange';
    } else {
        return 'red';
    }
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const searchTerm = search.value;
    selectedGenre = [];
    setGenre();
    if (searchTerm) {
        getMovies(searchURL + searchTerm);
    } else {
        getMovies(API_URL);
    }
});

prev.addEventListener('click', () => {
    if (prevPage > 0) {
        pageCall(prevPage);
    }
});

next.addEventListener('click', () => {
    if (nextPage <= totalPages) {
        pageCall(nextPage);
    }
});

function pageCall(page) {
    let urlSplit = lastUrl.split('?');
    let queryParams = urlSplit[1].split('&');
    let searchTerm = queryParams.find(param => param.startsWith('s=')).split('=')[1];
    let url = `${BASE_URL}?apikey=${API_KEY}&s=${searchTerm}&page=${page}`;
    getMovies(url);
}
