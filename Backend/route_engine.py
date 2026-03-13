from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import math

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (math.sin(dlat/2) ** 2 +
         math.cos(math.radians(lat1)) *
         math.cos(math.radians(lat2)) *
         math.sin(dlon/2) ** 2)

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c


def create_distance_matrix(locations):
    size = len(locations)
    matrix = []

    for i in range(size):
        row = []
        for j in range(size):
            if i == j:
                row.append(0)
            else:
                dist = calculate_distance(
                    locations[i][0], locations[i][1],
                    locations[j][0], locations[j][1]
                )
                row.append(int(dist))
        matrix.append(row)

    return matrix


def optimize_routes(locations, num_vehicles, demands, vehicle_capacity):
    distance_matrix = create_distance_matrix(locations)

    manager = pywrapcp.RoutingIndexManager(
        len(distance_matrix),
        num_vehicles,
        0,
    )

    routing = pywrapcp.RoutingModel(manager)

    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return distance_matrix[from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )

    solution = routing.SolveWithParameters(search_parameters)

    if not solution:
        return None

    routes = []
    total_distance = 0

    for vehicle_id in range(num_vehicles):
        index = routing.Start(vehicle_id)
        route = []
        route_distance = 0

        while not routing.IsEnd(index):
            route.append(manager.IndexToNode(index))
            previous_index = index
            index = solution.Value(routing.NextVar(index))
            route_distance += routing.GetArcCostForVehicle(
                previous_index, index, vehicle_id
            )

        route.append(manager.IndexToNode(index))

        routes.append({
            "vehicle_id": vehicle_id,
            "route": route,
            "distance": route_distance
        })

        total_distance += route_distance

    return {
        "routes": routes,
        "total_distance": total_distance
    }