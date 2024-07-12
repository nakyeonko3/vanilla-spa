import express from 'express';
import history from 'connect-history-api-fallback';
import morgan from 'morgan';

const PORT = process.env.PORT || 8080;
const app = express();

app.use(express.json());
app.use(morgan('dev'));
app.use(express.static('dist'));

app.use(
  history({
    verbose: true,
    rewrites: [
      {
        from: /^\/api\/.*$/,
        to: function (context) {
          return context.parsedUrl.pathname;
        },
      },
      {
        from: /^\/dist\/.*$/,
        to: function (context) {
          return context.parsedUrl.pathname;
        },
      },
    ],
  }),
);

// api/ 경로
app.get('/api/employees', (req, res) => {
  indb.getAllEmployees((employees) => {
    res.json({
      status: 'OK',
      data: employees,
    });
  });
});

app.get('/api/employees/:id', (req, res) => {
  const id = req.params.id;
  console.log(`/api/employees/${id} 라우팅 확인`);
  indb.getEmployeeById(id, (employee) => {
    res.json({
      status: 'OK',
      data: employee,
    });
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
