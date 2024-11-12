from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from werkzeug.security import check_password_hash
from dotenv import load_dotenv
import os
import mysql.connector

load_dotenv('keys.env')

app = Flask(__name__, static_folder='static', template_folder='templates')
app.secret_key = os.getenv('key')  # Generar llave segura para las sesiones

# String de conexion a la base de datos
def db_connection():
    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password=os.getenv('llave'),
        database="world"
    )
    return connection

# Ruta de inicio de sesion
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        # Conexion a la base de datos users para verificar las credenciales de inicio de sesion
        db = db_connection()
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users.authorized WHERE username = %s", (username,))
        user = cursor.fetchone()
        cursor.close()
        db.close()

        # Se revisa que exista el username y el password haga match
        if user and user['password'] == password:
            # Se guarda el username en sesion para permitir acceder a las funciones
            session['user_id'] = user['id']
            session['is_admin'] = user['isadmin'] == '1'
            return redirect(url_for('index'))
        else:
            return "Usuario o password no validos.", 401  # Respuesta de "No Autorizado"

    return render_template('login.html')

# Ruta de cierre de sesion
@app.route('/logout')
def logout():
    session.clear()  # Cierra y limpia la sesion
    return redirect(url_for('login'))

# Funcion que protege las rutas asegurando que el usuario este logeado
@app.before_request
def require_login():
    allowed_routes = ['login', 'logout']
    if 'user_id' not in session and request.endpoint not in allowed_routes:
        return redirect(url_for('login'))

# Ruta inicial
@app.route('/home')
def index():
    return render_template('index.html')

# Ruta para mostrar los datos en pantalla
@app.route('/api/cities', methods=['GET'])
def get_cities():
    conn = db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT ID, Name, CountryCode, District, Population FROM city")
    cities = cursor.fetchall()
    conn.close()
    return jsonify(cities)

# Ruta para agregar datos a la db
@app.route('/api/cities', methods=['POST'])
def add_city():
    data = request.get_json()
    if data:
        conn = db_connection()
        cursor = conn.cursor()
        name = data.get('Name')
        country_code = data.get('CountryCode')
        district = data.get('District')
        population = data.get('Population', 0)
        
        cursor = conn.cursor()
        cursor.execute("INSERT INTO city (Name, CountryCode, District, Population) VALUES (%s, %s, %s, %s)",
                       (name, country_code, district, population))
        conn.commit()
        cursor.close()
        
        return jsonify({"message": "City added successfully"}), 201
    return jsonify({"error": "Invalid data"}), 400

# Ruta para actualizacion de datos
@app.route('/api/cities/<int:id>', methods=['PUT'])
def update_city(id):
    updated_city = request.json
    conn = db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE city 
        SET Name = %s, CountryCode = %s, District = %s, Population = %s 
        WHERE ID = %s
    """, (updated_city['Name'], updated_city['CountryCode'], updated_city['District'], updated_city['Population'], id))
    conn.commit()
    conn.close()
    return jsonify(updated_city)

# Ruta para eliminacion de datos
@app.route('/api/cities/<int:id>', methods=['DELETE'])
def delete_city(id):
    conn = db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM city WHERE ID = %s", (id,))
    conn.commit()
    conn.close()
    return '', 204

# Ruta para busqueda de datos
@app.route('/api/cities/search')
def search_cities():
    name = request.args.get('name')
    country_code = request.args.get('countryCode')
    district = request.args.get('district')

    query = "SELECT * FROM city WHERE 1=1"  # Consulta base
    params = []

    conn = db_connection()
    cursor = conn.cursor()

    if name:
        query += " AND Name LIKE %s"
        params.append(f"%{name}%")
    if country_code:
        query += " AND CountryCode = %s"
        params.append(country_code)
    if district:
        query += " AND District LIKE %s"
        params.append(f"%{district}%")
    
    cursor = conn.cursor()
    cursor.execute(query, tuple(params))
    cities = cursor.fetchall()
    cursor.close()

    # Convierte a lista de diccionarios
    city_list = [
        {"ID": city[0], "Name": city[1], "CountryCode": city[2], "District": city[3], "Population": city[4]}
        for city in cities
    ]
    
    return jsonify(city_list)


if __name__ == '__main__':
    app.run(debug=True, port=5500)
